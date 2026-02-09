/**
 * Endpoint Testing Script
 * Run this in the browser console after starting the dev server
 */

const API_URL = 'https://ailern.runasp.net/api';

interface TestResult {
    endpoint: string;
    method: string;
    status: 'PASS' | 'FAIL';
    statusCode?: number;
    message: string;
    data?: any;
}

const results: TestResult[] = [];

async function testEndpoint(
    endpoint: string,
    method: string,
    body?: any,
    headers: Record<string, string> = {}
): Promise<TestResult> {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();

        return {
            endpoint,
            method,
            status: response.ok ? 'PASS' : 'FAIL',
            statusCode: response.status,
            message: data.message || 'Success',
            data,
        };
    } catch (error: any) {
        return {
            endpoint,
            method,
            status: 'FAIL',
            message: error.message,
        };
    }
}

async function runTests() {
    console.log('🧪 Starting API Endpoint Tests...\n');

    // Test 1: Admin Login
    console.log('1️⃣  Testing Admin Login...');
    const adminLogin = await testEndpoint('/Auth/login', 'POST', {
        email: 'admin@gmail.com',
        password: 'P@ssw0rd!',
    });
    results.push(adminLogin);
    console.log(
        `${adminLogin.status === 'PASS' ? '✅' : '❌'} Admin Login: ${adminLogin.message}`
    );

    // Test 2: Instructor Login
    console.log('2️⃣  Testing Instructor Login...');
    const instructorLogin = await testEndpoint('/Auth/login', 'POST', {
        email: 'instructor@gmail.com',
        password: 'P@ssw0rd!',
    });
    results.push(instructorLogin);
    console.log(
        `${instructorLogin.status === 'PASS' ? '✅' : '❌'} Instructor Login: ${instructorLogin.message}`
    );

    // Test 3: Student Login
    console.log('3️⃣  Testing Student Login...');
    const studentLogin = await testEndpoint('/Auth/login', 'POST', {
        email: 'student@gmail.com',
        password: 'P@ssw0rd!',
    });
    results.push(studentLogin);
    console.log(
        `${studentLogin.status === 'PASS' ? '✅' : '❌'} Student Login: ${studentLogin.message}`
    );

    // Test 4: Invalid Login
    console.log('4️⃣  Testing Invalid Credentials...');
    const invalidLogin = await testEndpoint('/Auth/login', 'POST', {
        email: 'invalid@example.com',
        password: 'wrongpassword',
    });
    results.push(invalidLogin);
    console.log(
        `${invalidLogin.status === 'FAIL' && invalidLogin.statusCode === 401 ? '✅' : '❌'} Invalid Login: ${invalidLogin.message}`
    );

    let accessToken = adminLogin.data?.data?.accessToken || '';

    // Test 5: Get Courses
    console.log('5️⃣  Testing Get Courses...');
    const getCourses = await testEndpoint('/Courses', 'GET');
    results.push(getCourses);
    console.log(
        `${getCourses.status === 'PASS' ? '✅' : '❌'} Get Courses: ${getCourses.message}`
    );

    // Test 6: Get Available Courses
    console.log('6️⃣  Testing Get Available Courses...');
    const availableCourses = await testEndpoint('/Courses/available-courses', 'GET');
    results.push(availableCourses);
    console.log(
        `${availableCourses.status === 'PASS' ? '✅' : '❌'} Available Courses: ${availableCourses.message}`
    );

    // Test 7: Password Reset Request
    console.log('7️⃣  Testing Password Reset Request...');
    const passwordReset = await testEndpoint('/Auth/send-password-reset-email', 'POST', {
        email: 'admin@gmail.com',
    });
    results.push(passwordReset);
    console.log(
        `${passwordReset.status === 'PASS' ? '✅' : '❌'} Password Reset: ${passwordReset.message}`
    );

    // Test 8: Refresh Token
    console.log('8️⃣  Testing Refresh Token...');
    const refreshToken = await testEndpoint('/Auth/refresh-token', 'POST', {
        refreshToken: 'mock-refresh-token',
    });
    results.push(refreshToken);
    console.log(
        `${refreshToken.status === 'PASS' ? '✅' : '❌'} Refresh Token: ${refreshToken.message}`
    );

    // Test 9: Student Registration
    console.log('9️⃣  Testing Student Registration...');
    const studentReg = await testEndpoint('/Auth/students/register', 'POST', {
        email: 'newstudent@example.com',
        firstName: 'New',
        lastName: 'Student',
        phoneNumber: '1234567890',
        password: 'P@ssw0rd!',
    });
    results.push(studentReg);
    console.log(
        `${studentReg.status === 'PASS' ? '✅' : '❌'} Student Registration: ${studentReg.message}`
    );

    // Test 10: Create Course (requires auth)
    if (accessToken) {
        console.log('🔟 Testing Create Course...');
        const createCourse = await testEndpoint(
            '/Courses',
            'POST',
            {
                title: 'Test Course',
                description: 'This is a test course',
                shortDescription: 'Test',
                category: 'Programming',
                level: 'Beginner',
                price: 99.99,
                duration: 600,
            },
            { Authorization: `Bearer ${accessToken}` }
        );
        results.push(createCourse);
        console.log(
            `${createCourse.status === 'PASS' ? '✅' : '❌'} Create Course: ${createCourse.message}`
        );
    }

    // Print Summary
    console.log('\n📊 Test Summary:');
    console.log('═'.repeat(50));
    const passed = results.filter((r) => r.status === 'PASS').length;
    const failed = results.filter((r) => r.status === 'FAIL').length;
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📝 Total: ${results.length}`);
    console.log('═'.repeat(50));

    // Print detailed results
    console.log('\n📋 Detailed Results:');
    console.table(
        results.map((r) => ({
            Endpoint: r.endpoint,
            Method: r.method,
            Status: r.status,
            Code: r.statusCode,
            Message: r.message,
        }))
    );

    return results;
}

// Export for use in browser console
if (typeof window !== 'undefined') {
    (window as any).runEndpointTests = runTests;
    console.log('✨ Test script loaded! Run: runEndpointTests()');
}

export { runTests, testEndpoint };
