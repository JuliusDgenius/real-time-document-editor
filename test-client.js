import { io } from 'socket.io-client';
import axios from 'axios';

// COnfigs
const BASE_URL = 'http://localhost:3000';
const DOCUMENT_ID = 1
const USER_TOKENS = {
    user1: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTUsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzQzMTU2NjcwLCJleHAiOjE3NDMxNjAyNzB9.K183KShWOJn4H8Swxuw3QxJC8zjoX8quwW6hhYNB35s",

    user2: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzQzMTU2NzMwLCJleHAiOjE3NDMxNjAzMzB9.4xoD2-CAJQ939M4KypG7X-CYq_A6G1GHRPZG_Dq3DNw"
}

// Helper function: Create a Socket.io client instance
const createClient = (token) => {
    return io(BASE_URL, {
        extraHeaders: {
            Authorization: `Bearer ${token}`
        },
        transports: ["websocket"],
    });
}

// Test flow
const testRealTime = async () => {
    try {
    // Step 1: Create/get document
    const docResponse = await axios.post(
        `${BASE_URL}/documents/create-document`,
        { title: "Test Document", content: "Initial content" },
        { headers: { Authorization: `Bearer ${USER_TOKENS.user1}` } }
    );
    console.log("Document created:", docResponse.data);

    // Step 2: Simulate user 2 users joining
    const client1 = createClient(USER_TOKENS.user1);
    const client2 = createClient(USER_TOKENS.user2);

    // Join document room
    client1.emit("join-document", DOCUMENT_ID);
    client2.emit("join-document", DOCUMENT_ID);

    // Listen for updates
    client1.on("document-update", (data) => {
        console.log("client1 received update:", data);
    });
    client2.on("document-update", (data) => {
        console.log("client2 received update:", data);
    });

    // Step 3: User1 edits the doc
    console.log("\nUser1 editing document...",);
    client1.emit("document-edit", {
        documentId: DOCUMENT_ID,
        content: "Edited by user1",
    });

    // Step 4: User2 edits to simulate conflict
    setTimeout(() => {
        console.log("\nUser2 editing document (stale version)...");
        client2.emit("document-edit", {
            documendId: DOCUMENT_ID,
            content: "Edited by user2 (stale version)",
            version: 1
        });
    }, 2000);
    
    } catch (error) {
      console.error("Test failed", error.message); 
    }
}

testRealTime();