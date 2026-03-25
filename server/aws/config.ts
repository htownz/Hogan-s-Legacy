import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

// Common configuration for all AWS services
const commonConfig = {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
};

// Create S3 client instance
export const s3Client = new S3Client(commonConfig);

// Create DynamoDB client instance
const ddbClient = new DynamoDBClient(commonConfig);
// Create DynamoDB Document client (higher-level abstraction)
export const docClient = DynamoDBDocumentClient.from(ddbClient);

// Create Cognito Identity Provider client instance
export const cognitoClient = new CognitoIdentityProviderClient(commonConfig);