import { 
  DynamoDBClient, 
  QueryCommand, 
  ScanCommand, 
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommandInput,
  ScanCommandInput,
  PutCommandInput,
  GetCommandInput,
  DeleteCommandInput,
  QueryCommand as DocQueryCommand,
  ScanCommand as DocScanCommand,
  PutCommand as DocPutCommand,
  GetCommand as DocGetCommand,
  DeleteCommand as DocDeleteCommand,
} from "@aws-sdk/lib-dynamodb";

// Configure AWS SDK
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "demo-access-key",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "demo-secret-key",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

export class DynamoService {
  /**
   * Get an item from a DynamoDB table
   * @param tableName - Name of the table
   * @param key - Key of the item to get
   */
  async getItem<T>(tableName: string, key: Record<string, any>): Promise<T | undefined> {
    const command = new DocGetCommand({
      TableName: tableName,
      Key: key
    });
    
    const response = await docClient.send(command);
    return response.Item as T | undefined;
  }

  /**
   * Put an item into a DynamoDB table
   * @param tableName - Name of the table
   * @param item - Item to put
   */
  async putItem<T extends Record<string, any>>(tableName: string, item: T): Promise<void> {
    const command = new DocPutCommand({
      TableName: tableName,
      Item: item
    });
    
    await docClient.send(command);
  }

  /**
   * Delete an item from a DynamoDB table
   * @param tableName - Name of the table
   * @param key - Key of the item to delete
   */
  async deleteItem(tableName: string, key: Record<string, any>): Promise<void> {
    const command = new DocDeleteCommand({
      TableName: tableName,
      Key: key
    });
    
    await docClient.send(command);
  }
  
  /**
   * Scan a DynamoDB table
   * @param tableName - Name of the table
   */
  async scan<T>(tableName: string): Promise<T[]> {
    const command = new DocScanCommand({
      TableName: tableName
    });
    
    const response = await docClient.send(command);
    return (response.Items || []) as T[];
  }
  
  /**
   * Query items from a DynamoDB table
   * @param tableName - Name of the table
   * @param keyConditionExpression - Key condition expression for query
   * @param expressionAttributeValues - Expression attribute values for query
   */
  async queryItems<T>(
    tableName: string, 
    keyConditionExpression: string,
    expressionAttributeValues: Record<string, any>
  ): Promise<T[]> {
    const command = new DocQueryCommand({
      TableName: tableName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues
    });
    
    const response = await docClient.send(command);
    return (response.Items || []) as T[];
  }
  
  /**
   * Check if a table exists
   * @param tableName - Name of the table to check
   */
  async tableExists(tableName: string): Promise<boolean> {
    try {
      const command = new DocScanCommand({
        TableName: tableName,
        Limit: 1
      });
      
      await docClient.send(command);
      return true;
    } catch (error: any) {
      if (error instanceof Error && error.name === 'ResourceNotFoundException') {
        return false;
      }
      throw error;
    }
  }
}

export const dynamoService = new DynamoService();