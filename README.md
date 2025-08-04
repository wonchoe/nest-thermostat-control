# Nest Thermostat + AWS Lambda Integration

This project connects a Nest Thermostat to AWS Lambda using sensor data from an ESP32 with a DHT22 sensor, sent via AWS IoT Core and stored in DynamoDB.

## Goal

Automatically control home climate based on humidity:
- If humidity > 65% → turn on the A/C
- Reset to 77°F once humidity drops
- Turn on the fan every night at 10 PM for 12 hours

## Key Components

- **ESP32 + DHT22** → sends data to AWS IoT Core
- **DynamoDB** → stores temperature and humidity
- **AWS Lambda** → processes data and controls Nest
- **EventBridge** → triggers Lambda on schedule
- **SSM Parameter Store** → holds Google API credentials

## Setup Instructions

1. Enable the [Smart Device Management API](https://console.cloud.google.com/marketplace/product/google/smartdevicemanagement.googleapis.com)
2. Create OAuth 2.0 client and obtain credentials
3. Register a [Device Access project](https://console.nest.google.com/device-access/project-list) and pay the one-time $5 fee
4. Store credentials in AWS SSM
5. Deploy the Lambda function and attach IAM permissions
6. Create two EventBridge schedules:
   - One for humidity monitoring
   - One for nightly fan mode


## Real-time data
You can view real-time data and historical trends (temperature, humidity, trigger activation) here:  
**[http://iot-oleksii.s3-website-us-east-1.amazonaws.com](http://iot-oleksii.s3-website-us-east-1.amazonaws.com)**

## Resources

- 📘 Article: [Automating Climate Control with Nest, AWS Lambda, and IoT Sensor Data](https://www.linkedin.com/pulse/automating-climate-control-nest-aws-lambda-iot-sensor-semeniuk-xp8ye)
