import { Account, Avatars, Client, Databases, ID, Query, Storage } from 'react-native-appwrite';

export const appwriteConfig = {
    endpoint: 'https://cloud.appwrite.io/v1',
    platform: 'com.paulo.aora',
    projectId: '6660690f001e9710853b',
    databaseId: '66606b2f000436a2b88d',
    userCollectionId: '66606b4b00269924da20',
    videoCollectionId: '66606b7300268b52167b',
    storageId: '66606cc3003cf4f274f5'
}
  
  const client = new Client();
  
  client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform);
  
  const account = new Account(client);
  const storage = new Storage(client);
  const avatars = new Avatars(client);
  const databases = new Databases(client);
  
  // Register user
  export async function createUser(username, email, password) {
    try {
      const newAccount = await account.create(
        ID.unique(),
        email,
        password,
        username
      );

      console.log(newAccount)
  
      if (!newAccount) throw Error;
  
      const avatarUrl = avatars.getInitials(username);
  
      await signIn(email, password);
  
      const newUser = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        ID.unique(),
        {
          accountId: newAccount.$id,
          email: email,
          username: username,
          avatar: avatarUrl,
        }
      );
  
      return newUser;
    } catch (error) {
      throw new Error(error);
    }
  }
  
  // Sign In
  export async function signIn(email, password) {
    try {
      const session = await account.createEmailPasswordSession(email, password);

      return session;
    } catch (error) {
      throw new Error(error);
    }
  }
  
  //Get Account
  export async function getAccount() {
    try {
      const currentAccount = await account.get();
  
      return currentAccount;
    } catch (error) {
      throw new Error(error);
    }
  }
  
  // Get Current User
  export async function getCurrentUser() {
    try {
      const currentAccount = await getAccount();
      if (!currentAccount) throw Error;
  
      const currentUser = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        [Query.equal("accountId", currentAccount.$id)]
      );
  
      if (!currentUser) throw Error;
  
      return currentUser.documents[0];
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  
  // Sign Out
  export async function signOut() {
    try {
      const session = await account.deleteSession("current");
  
      return session;
    } catch (error) {
      throw new Error(error);
    }
  }
  
  // Upload File
  export async function uploadFile(file, type) {
    if (!file) return;
  
    const { mimeType, ...rest } = file;
    const asset = { 
      name: file.fileName,
      type: file.mimeType,
      size: file.fileSize,
      uri: file.uri
    }
  
    try {
      const uploadedFile = await storage.createFile(
        appwriteConfig.storageId,
        ID.unique(),
        asset
      );
  
      const fileUrl = await getFilePreview(uploadedFile.$id, type);
      return fileUrl;
    } catch (error) {
      throw new Error(error);
    }
  }
  
  // Get File Preview
  export async function getFilePreview(fileId, type) {
    let fileUrl;
  
    try {
      if (type === "video") {
        fileUrl = storage.getFileView(appwriteConfig.storageId, fileId);
      } else if (type === "image") {
        fileUrl = storage.getFilePreview(
          appwriteConfig.storageId,
          fileId,
          2000,
          2000,
          "top",
          100
        );
      } else {
        throw new Error("Invalid file type");
      }
  
      if (!fileUrl) throw Error;
  
      return fileUrl;
    } catch (error) {
      throw new Error(error);
    }
  }
  
  // Create Video Post
  export async function createVideoPost(form) {
    try {
      const [thumbnailUrl, videoUrl] = await Promise.all([
        uploadFile(form.thumbnail, "image"),
        uploadFile(form.video, "video"),
      ]);
  
      const newPost = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.videoCollectionId,
        ID.unique(),
        {
          title: form.title,
          thumbnail: thumbnailUrl,
          video: videoUrl,
          prompt: form.prompt,
          users: form.userId,
        }
      );
  
      return newPost;
    } catch (error) {
      throw new Error(error);
    }
  }
  
  // Get all video Posts
  export async function getAllPosts() {
    try {
      const posts = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.videoCollectionId,
        [Query.orderDesc("$createdAt")]
      );
      return posts.documents;
    } catch (error) {
      throw new Error(error);
    }
  }
  
  // Get video posts created by user
  export async function getUserPosts(userId) {
    try {
      const posts = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.videoCollectionId,
        [Query.equal("users", userId), Query.orderDesc("$createdAt")]
      );
      return posts.documents;
    } catch (error) {
      throw new Error(error);
    }
  }
  
  // Get video posts that matches search query
  export async function searchPosts(query) {
    try {
      const posts = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.videoCollectionId,
        [Query.search("title", query)]
      );
  
      if (!posts) throw new Error("Something went wrong");
  
      return posts.documents;
    } catch (error) {
      throw new Error(error);
    }
  }
  
  // Get latest created video posts
  export async function getLatestPosts() {
    try {
      const posts = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.videoCollectionId,
        [Query.orderDesc("$createdAt"), Query.limit(7)]
      );
  
      return posts.documents;
    } catch (error) {
      throw new Error(error);
    }
  }