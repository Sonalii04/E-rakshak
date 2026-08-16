import app from "../src/app.js";
import { paths } from "../src/config/paths.js";
import pool from "../src/database/db.js";
import fs from "fs/promises";
import path from "path";

const PORT = 3005;
let server;

async function runTests() {
    console.log("==========================================");
    console.log("   E-RAKSHAK BACKEND INTEGRATION TESTS    ");
    console.log("==========================================");

    // Clean databases for clean test run
    try {
        console.log("Cleaning database tables...");
        await pool.query("TRUNCATE TABLE users, cases, evidence, timeline_events, audit_logs, search_history, saved_searches CASCADE;");
        console.log("Database tables cleaned successfully.");
    } catch (err) {
        console.warn("Database clean failed (probably running offline/in-memory logs):", err.message);
    }

    const cleanFiles = ["users.json", "cases.json", "evidence.json", "timeline.json", "audit_logs.json", "search_history.json", "saved_searches.json"];
    for (const file of cleanFiles) {
        try {
            await fs.writeFile(path.join(paths.dataDir, file), "[]", "utf-8");
        } catch (_) {}
    }

    // Start test server
    server = app.listen(PORT, async () => {
        console.log(`Test server running on port ${PORT}`);
        try {
            await executeTestFlow();
            console.log("\n[PASS] All backend integration tests passed successfully!");
            await cleanupAndExit(0);
        } catch (err) {
            console.error("\n[FAIL] Backend integration test failed:", err);
            await cleanupAndExit(1);
        }
    });
}

async function cleanupAndExit(code) {
    try {
        await pool.end();
    } catch (_) {}
    if (server) {
        server.close(() => {
            console.log("Test server stopped.");
            process.exit(code);
        });
    } else {
        process.exit(code);
    }
}

async function executeTestFlow() {
    const baseUrl = `http://localhost:${PORT}/api`;

    // 1. Health Status check
    console.log("\nTesting health status check...");
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    console.log("Health check response:", healthData);
    if (healthRes.status !== 200 || !healthData.backend) {
        throw new Error("Health check failed");
    }

    // 2. Auth: Register ADMIN
    console.log("\nTesting admin registration...");
    const regRes = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: "admin_test",
            password: "securepassword123",
            role: "ADMIN"
        })
    });
    const regData = await regRes.json();
    console.log("Register response:", regData);
    if (regRes.status !== 201 || regData.role !== "ADMIN") {
        throw new Error("Admin registration failed");
    }

    // 3. Auth: Login
    console.log("\nTesting login...");
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: "admin_test",
            password: "securepassword123"
        })
    });
    const loginData = await loginRes.json();
    console.log("Login response status:", loginRes.status);
    if (loginRes.status !== 200 || !loginData.token) {
        throw new Error("Login failed");
    }
    const adminToken = loginData.token;
    const authHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminToken}`
    };

    // 4. Case Management CRUD
    console.log("\nTesting Case CRUD...");
    const createCaseRes = await fetch(`${baseUrl}/cases`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            title: "Test Theft Investigation",
            description: "Investigating mock vehicle theft near main entrance gate.",
            priority: "High"
        })
    });
    const caseData = await createCaseRes.json();
    console.log("Created Case:", caseData);
    if (createCaseRes.status !== 201 || !caseData.id) {
        throw new Error("Case creation failed");
    }
    const caseId = caseData.id;

    // Update case status
    const updateCaseRes = await fetch(`${baseUrl}/cases/${caseId}`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
            status: "In Progress"
        })
    });
    const updatedCaseData = await updateCaseRes.json();
    console.log("Updated Case Status:", updatedCaseData.status);
    if (updatedCaseData.status !== "In Progress") {
        throw new Error("Case update failed");
    }

    // Add note
    const addNoteRes = await fetch(`${baseUrl}/cases/${caseId}/notes`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            text: "Initial suspect track identified on camera 1."
        })
    });
    const caseWithNote = await addNoteRes.json();
    console.log("Case Notes Count:", caseWithNote.notes.length);
    if (caseWithNote.notes.length !== 1) {
        throw new Error("Add case note failed");
    }

    // 5. Query Preprocessing & Dynamic Search
    console.log("\nTesting AI Search with filters...");
    const searchRes = await fetch(`${baseUrl}/search`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            query: "blue bus entering outside",
            topK: 5
        })
    });
    const searchData = await searchRes.json();
    console.log("Search dynamic results count:", searchData.results.length);
    if (searchRes.status !== 200 || !searchData.results) {
        throw new Error("AI Search execution failed");
    }

    // 6. Evidence Bookmarking
    console.log("\nTesting Evidence Bookmarking...");
    const testTrack = searchData.results[0];
    if (!testTrack) {
        throw new Error("No test track found to run evidence bookmarking");
    }

    const bookmarkRes = await fetch(`${baseUrl}/evidence/bookmark`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
            caseId: caseId,
            trackId: testTrack.trackId,
            cameraId: testTrack.cameraId,
            timestamp: testTrack.firstSeenTime || new Date().toISOString(),
            description: "Suspect vehicle observed exiting the perimeter.",
            similarity: testTrack.similarity
        })
    });
    const bookmarked = await bookmarkRes.json();
    console.log("Bookmarked Evidence ID:", bookmarked.id);
    if (bookmarkRes.status !== 201 || !bookmarked.id) {
        throw new Error("Evidence bookmarking failed");
    }

    // 7. Case Report Generation
    console.log("\nTesting JSON Report generation...");
    const reportRes = await fetch(`${baseUrl}/report/${caseId}`, {
        method: "GET",
        headers: authHeaders
    });
    const reportData = await reportRes.json();
    console.log("Report statistics evidence count:", reportData.data.statistics.evidenceCount);
    if (reportRes.status !== 200 || reportData.data.statistics.evidenceCount !== 1) {
        throw new Error("Report generation failed");
    }

    // 8. PDF Export Download
    console.log("\nTesting PDF Report export download...");
    const pdfRes = await fetch(`${baseUrl}/report/${caseId}/pdf`, {
        method: "GET",
        headers: authHeaders
    });
    console.log("PDF Report response status:", pdfRes.status);
    console.log("PDF Content Type:", pdfRes.headers.get("content-type"));
    if (pdfRes.status !== 200 || pdfRes.headers.get("content-type") !== "application/pdf") {
        throw new Error("PDF report generation failed");
    }

    // 9. RBAC Validation check (Register VIEWER)
    console.log("\nTesting RBAC limits (Registering VIEWER)...");
    const viewerRegRes = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: "viewer_test",
            password: "viewerpassword123",
            role: "VIEWER"
        })
    });
    const viewerRegData = await viewerRegRes.json();
    if (viewerRegRes.status !== 201) {
        throw new Error("Viewer registration failed");
    }

    // Login Viewer
    const viewerLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: "viewer_test",
            password: "viewerpassword123"
        })
    });
    const viewerLoginData = await viewerLoginRes.json();
    const viewerToken = viewerLoginData.token;
    const viewerHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${viewerToken}`
    };

    // Try posting search with viewer (allowed)
    console.log("Testing search with viewer role (should be allowed)...");
    const viewerSearchRes = await fetch(`${baseUrl}/search`, {
        method: "POST",
        headers: viewerHeaders,
        body: JSON.stringify({ query: "blue bus" })
    });
    console.log("Viewer search status:", viewerSearchRes.status);
    if (viewerSearchRes.status !== 200) {
        throw new Error("Viewer search was blocked unexpectedly");
    }

    // Try posting assistant/investigate with viewer (should be forbidden)
    console.log("Testing investigate with viewer role (should be forbidden)...");
    const viewerInvestigateRes = await fetch(`${baseUrl}/assistant/investigate`, {
        method: "POST",
        headers: viewerHeaders,
        body: JSON.stringify({ query: "blue bus" })
    });
    console.log("Viewer investigate status (expected 403):", viewerInvestigateRes.status);
    if (viewerInvestigateRes.status !== 403) {
        throw new Error("Viewer was allowed to run assistant investigate query!");
    }
}

runTests();
