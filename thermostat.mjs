export async function setTemperatureC(access_token, tempC) {
    const response = await fetch(
      'https://smartdevicemanagement.googleapis.com/v1/enterprises/14490c42-582b-46b3-adb9-e9919a949c9a/devices/AVPHwEu2O_V-fWW8xwwfcrt8gE5-op2UiFcZo3ymG5upR7eLC4C8f6xiedlvwvh2eGdDstuLxGc-ihMipsFK3a4Tk1LCcw:executeCommand',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: 'sdm.devices.commands.ThermostatTemperatureSetpoint.SetCool',
          params: {
            coolCelsius: tempC
          }
        })
      }
    );
  
    const result = await response.json();
  
    if (!response.ok) {
      console.error('Nest API error:', result);
      throw new Error(`Nest thermostat error: ${result.error?.message || response.statusText}`);
    }
  
    console.log(`Temperature ${tempC}°C set successfully.`);
  }
  