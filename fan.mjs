export async function runFanIfNeeded(access_token) {
 
      const response = await fetch(
        'https://smartdevicemanagement.googleapis.com/v1/enterprises/14490c42-582b-46b3-adb9-e9919a949c9a/devices/AVPHwEu2O_V-fWW8xwwfcrt8gE5-op2UiFcZo3ymG5upR7eLC4C8f6xiedlvwvh2eGdDstuLxGc-ihMipsFK3a4Tk1LCcw:executeCommand',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            command: 'sdm.devices.commands.Fan.SetTimer',
            params: {
              timerMode: "ON",
              duration: '43200s', // 12 hours
            },
          }),
        }
      );
  
      const result = await response.json();
  
      if (!response.ok) {
        console.error('Fan command failed:', result);
      } else {
        console.log('Fan command successful:', result);
      }
  }
  