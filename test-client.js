import { io } from 'socket.io-client';
import axios from 'axios';
import { Socket } from 'socket.io';

// Configs
const BASE_URL = 'http://localhost:3000';
const USER_TOKENS = {
    user1: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjAsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzQ0MjAzMzQzLCJleHAiOjE3NDQyMDY5NDN9.R-FtRNqkCj8zHolmtWRJ5W-TU1KawkoEi0395K-_W3U",

    user2: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjIsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzQ0MjAzNDE3LCJleHAiOjE3NDQyMDcwMTd9.s85sIli9W9CREwasEVMMMA3ztkiO9XImuz_UIk6qpUU",
    user3: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MjMsInJvbGUiOiJVU0VSIiwiaWF0IjoxNzQ0MjA0MzQxLCJleHAiOjE3NDQyMDc5NDF9.i1Prat4oZoMDnpQeNl27gwmRN61NyyNGszmI5tzixzA",
}

// Helper function: Create a Socket.io client instance
const createClient = (token) => {
    const client = io(BASE_URL, {
        query: { token },
        transports: ["websocket"],
    });

    // Listen for auth errors
    client.on("auth-erro", (message) => {
        console.log("Authentication failed:", message);
    });

    client.on("connect_error", (err) => {
        console.log("Connection error:", err.message);
        
    });

    return client;
}

// Test flow
const testRealTime = async () => {
    try {
      // Step 1: Create document
      const docResponse = await axios.post(
        `${BASE_URL}/documents/create-document`,
        { title: "Shared Document10", content: "Initial content" },
        { headers: { Authorization: `Bearer ${USER_TOKENS.user1}` } }
    ).catch((err) => {
        console.error("REST API error", err.response?.data);
        throw err;
    });
    let documentId = docResponse.data.id;
    console.log("Document created:", docResponse.data);

    // Step 2: Simulate user 2 users joining
    const client1 = createClient(USER_TOKENS.user1);
    const client2 = createClient(USER_TOKENS.user2);
    const client3 = createClient(USER_TOKENS.user3);


    // Step 3: Join document room
    client1.emit("join-document", documentId);
    client2.emit("join-document", documentId);
    client3.emit("join-document", documentId);

    // Step 4: Listen for updates
    client1.on("document-update", (data) => {
        console.log("client1 received update:", data);
    });
    client2.on("document-update", (data) => {
        console.log("client2 received update:", data);
    });

    // Listen for conflict-error events
    client1.on("conflict-error", (message) => {
        console.log("Client1 received a conflict error:", { error: message
        });
    });
    client2.on("conflict-error", (message) => {
        console.log("Client2 received a conflict error:", {
            error: message
        });
    });

    // Step 5: User1 edits the doc
    console.log("\nUser1 editing document...",);
    client1.emit("document-edit", {
        documentId,
        content: "Edited by user1",
        version: docResponse.data.version
    });

    // Step 6: User1 shares document with User2
    console.log(`\nUser1 is sharing ${JSON.stringify(docResponse.data.title)} with User2...`);
    const sharedDoc = await axios.post(`${BASE_URL}/documents/${documentId}/share`, {
        email: "user2@example.com",
        permission: "edit"
    }, {
        headers: { Authorization: `Bearer ${USER_TOKENS.user1}` }
    }).catch((err) => {
        console.error("REST API error", err.response?.data);
        throw err;
    });

    if (!sharedDoc) {
        console.log(`Failed to share (${documentId})`);
    } else {
        console.log(`Document (${JSON.stringify(sharedDoc)}) is shared successfully`);
    }

    // Step 7: User1 shares document with User3
    console.log(`\nUser1 is sharing ${JSON.stringify(docResponse.data.title)} with User3...`);
    const sharedDoc1 = await axios.post(`${BASE_URL}/documents/${documentId}/share`, {
        email: "user3@example.com",
        permission: "edit"
    }, {
        headers: { Authorization: `Bearer ${USER_TOKENS.user1}` }
    }).catch((err) => {
        console.error("REST API error", err.response?.data);
        throw err;
    });

    if (!sharedDoc1) {
        console.log(`Failed to share (${documentId})`);
    } else {
        console.log(`Document (${sharedDoc1}) is shared successfully`);
    }

    // Step 7: User2 edits to simulate conflict
    setTimeout(async () => {
        try {
        // Fetch current version to simulate stale data
        const doc = await axios.get(`${BASE_URL}/documents/${documentId}`, {
            headers: { Authorization: `Bearer ${USER_TOKENS.user2}` }
        }).catch((err) => {
            console.error("REST API error", err.response?.data);
            throw err;
        });

        console.log("Fetched document:", doc.data);

        console.log(("\nUser2 editing with stale version...", documentId));
        client2.emit("document-edit", {
            documentId,
            "content": "Edited by User2 (stale)",
            "version": doc.data.version - 1 // to force conflict
        });

        console.log('\User3 editing with correction version...');
        client3.emit("document-edit", {
            documentId,
            "content": "Edited by User3",
            "version": doc.data.version,
        });
        
        } catch (error) {
          console.error("User2 failed to fetch document", error.message);
        }
    }, 2000);
    
    } catch (error) {
      console.error("Test failed:", {
        error: error.message,
        stack: error.stack
    }); 
    }
}

testRealTime();