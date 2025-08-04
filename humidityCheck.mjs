import { DynamoDBClient, QueryCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });

// ⏱️ UTC timestamp для DynamoDB порівняння
function getNowMs() {
  return Date.now();
}

// 🕓 Отримуємо годину в NY (0–23)
function getNewYorkHour() {
  const ny = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  return new Date(ny).getHours();
}

// 🔎 Запит останнього запису з вікном ±13 хвилин назад, +10 хв наперед
async function getLatestHumidity() {
  const now = getNowMs();
  const from = now - 13 * 60 * 1000;
  const to = now + 10 * 60 * 1000;

  console.log('UTC now:', now);
  console.log('Query window:', from, '→', to);

  const command = new QueryCommand({
    TableName: 'iot_readings',
    KeyConditionExpression: 'deviceId = :d AND #ts BETWEEN :from AND :to',
    ExpressionAttributeNames: { '#ts': 'timestamp' },
    ExpressionAttributeValues: {
      ':d': { S: 'esp32-001' },
      ':from': { N: String(from) },
      ':to': { N: String(to) }
    },
    ScanIndexForward: false,
    Limit: 1
  });

  const data = await client.send(command);
  const item = data.Items?.[0];
  return item ? unmarshall(item) : null;
}

// 🧠 Оновлення значення acTriggered
async function setACTriggered(deviceId, timestamp, triggered) {
  await client.send(new UpdateItemCommand({
    TableName: 'iot_readings',
    Key: {
      deviceId: { S: deviceId },
      timestamp: { N: String(timestamp) }
    },
    UpdateExpression: 'SET acTriggered = :triggered',
    ExpressionAttributeValues: {
      ':triggered': { N: String(triggered) }
    }
  }));
}

// 📊 Основна логіка: якщо вологість ≥65 → 22°C, інакше → 25°C вдень, або ніч
export async function checkHumidityAndSetTemp() {
  const latest = await getLatestHumidity();
  if (!latest) throw new Error('No humidity data found');

  const hum = latest.hum;
  const hour = getNewYorkHour();
  const timestamp = latest.timestamp;
  let acTriggered = 0;

  if (hum >= 65) {
    console.log(`[Humidity ${hum}] ≥ 65 → return 22°C`);
    acTriggered = 1;
    await setACTriggered('esp32-001', timestamp, acTriggered);
    return { tempC: 22 };
  }

  if (hour >= 10 && hour < 22) {
    console.log(`[Humidity ${hum}, ${hour}h] < 65 → return 25°C`);
    await setACTriggered('esp32-001', timestamp, acTriggered);
    return { tempC: 25 };
  }

  console.log(`[Humidity ${hum}, ${hour}h] < 65 → return null (night)`);
  await setACTriggered('esp32-001', timestamp, acTriggered);
  return null;
}
