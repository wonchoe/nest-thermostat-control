import {
  DynamoDBClient,
  QueryCommand,
  PutItemCommand
} from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const dynamo = new DynamoDBClient({ region: "us-east-1" });
const ssm = new SSMClient({ region: "us-east-1" });

const TABLE_NAME = "iot_readings";
const TOKEN_DEVICE_ID = "access_token";
const TTL_MS = 30 * 60 * 1000; // 30 хвилин

// Отримуємо client_id, client_secret, refresh_token з SSM
async function getOAuthCredentials() {
  const cmd = new GetParameterCommand({
    Name: "/nest/oauth",
    WithDecryption: true,
  });
  const result = await ssm.send(cmd);
  return JSON.parse(result.Parameter.Value);
}

// Отримуємо останній токен з DynamoDB
async function getTokenFromDynamo() {
  const cmd = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'deviceId = :d',
    ExpressionAttributeValues: {
      ':d': { S: TOKEN_DEVICE_ID }
    },
    ScanIndexForward: false, // останній перший
    Limit: 1
  });

  const data = await dynamo.send(cmd);
  const item = data.Items?.[0];
  if (!item) return null;

  const record = unmarshall(item);
  const ageMs = Date.now() - Number(record.timestamp);
  const isValid = ageMs < TTL_MS;

  console.log(`Cached token age: ${(ageMs / 60000).toFixed(1)} min`);
  return isValid ? record.token : null;
}

// Зберігаємо новий токен з поточним часом
async function storeTokenToDynamo(token) {
  const cmd = new PutItemCommand({
    TableName: TABLE_NAME,
    Item: {
      deviceId: { S: TOKEN_DEVICE_ID },
      timestamp: { N: `${Date.now()}` },
      token: { S: token }
    }
  });

  await dynamo.send(cmd);
  console.log('Stored new access_token in DynamoDB');
}

// Головна функція, яку викликаєш ззовні
export async function getAccessToken() {
  const cached = await getTokenFromDynamo();
  if (cached) {
    console.log('Using cached access_token');
    return cached;
  }

  console.log('Refreshing access_token from Google');

  const { client_id, client_secret, refresh_token } = await getOAuthCredentials();

  const body = new URLSearchParams({
    client_id,
    client_secret,
    refresh_token,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  }

  await storeTokenToDynamo(data.access_token);
  return data.access_token;
}
