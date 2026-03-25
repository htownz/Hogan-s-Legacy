import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminInitiateAuthCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  ListUsersCommand,
  AuthFlowType,
} from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient } from "./config";

// Constants 
const USER_POOL_ID = "us-east-1_abc123"; // Replace with your actual Cognito User Pool ID
const CLIENT_ID = "abcdefghijklmnopqrstuvwxyz"; // Replace with your actual Cognito App Client ID

export class CognitoService {
  /**
   * Create a new user in Cognito
   * @param username - The username for the user
   * @param email - The email for the user
   * @param temporaryPassword - Optional temporary password
   */
  async createUser(username: string, email: string, temporaryPassword?: string): Promise<void> {
    const command = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      UserAttributes: [
        {
          Name: "email",
          Value: email,
        },
        {
          Name: "email_verified",
          Value: "true",
        },
      ],
      TemporaryPassword: temporaryPassword,
    });

    await cognitoClient.send(command);
  }

  /**
   * Authenticate a user with Cognito
   * @param username - The username for the user
   * @param password - The password for the user
   */
  async authenticateUser(username: string, password: string): Promise<any> {
    const command = new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    });

    const response = await cognitoClient.send(command);
    return response;
  }

  /**
   * Set a permanent password for a user
   * @param username - The username for the user
   * @param password - The permanent password to set
   */
  async setUserPassword(username: string, password: string): Promise<void> {
    const command = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      Password: password,
      Permanent: true,
    });

    await cognitoClient.send(command);
  }

  /**
   * Get user details from Cognito
   * @param username - The username for the user
   */
  async getUser(username: string): Promise<any> {
    const command = new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    });

    return await cognitoClient.send(command);
  }

  /**
   * Update user attributes in Cognito
   * @param username - The username of the user
   * @param attributes - The attributes to update
   */
  async updateUserAttributes(username: string, attributes: { Name: string; Value: string }[]): Promise<void> {
    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
      UserAttributes: attributes,
    });

    await cognitoClient.send(command);
  }

  /**
   * Delete a user from Cognito
   * @param username - The username of the user to delete
   */
  async deleteUser(username: string): Promise<void> {
    const command = new AdminDeleteUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username,
    });

    await cognitoClient.send(command);
  }

  /**
   * List users in the Cognito user pool
   * @param limit - Maximum number of users to return
   * @param paginationToken - Token for paginated results
   */
  async listUsers(limit?: number, paginationToken?: string): Promise<any> {
    const command = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Limit: limit,
      PaginationToken: paginationToken,
    });

    return await cognitoClient.send(command);
  }
}

export const cognitoService = new CognitoService();