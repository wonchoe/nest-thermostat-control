import { getAccessToken } from './token.mjs';
import { runFanIfNeeded } from './fan.mjs';
import { checkHumidityAndSetTemp } from './humidityCheck.mjs';
import { setTemperatureC } from './thermostat.mjs';

export const handler = async (event) => {
  try {

    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event;

    if (body.setFan) {
      const access_token = await getAccessToken();
      await runFanIfNeeded(access_token);
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'fan set' }),
      };
    }

    const result = await checkHumidityAndSetTemp();

    if (!result) {
      console.log("⏳ Skipped: night mode or no humidity");
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'skipped — Marker null' }),
      };
    }
    
    const { tempC } = result;

    console.log("Temperature set to:", tempC);

    const access_token = await getAccessToken();

    await setTemperatureC(access_token, tempC);


    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'fan and humidity check completed' }),
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

