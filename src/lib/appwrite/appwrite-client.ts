import { Client, Account, Databases, Storage, Functions } from "appwrite";
import { APPWRITE_CONFIG } from '$lib/utils/constants';

// Initialize Appwrite client
const client = new Client();
client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

// Initialize services
const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);
const functions = new Functions(client);

export { client, account, databases, storage, functions };

// Export commonly used utilities
export { ID, Query, Permission, Role } from 'appwrite';