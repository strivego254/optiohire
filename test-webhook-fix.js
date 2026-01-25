#!/usr/bin/env node

/**
 * Test script to verify webhook fix
 * Run this after fixing the n8n webhook configuration
 */

const testPayload = {
  job_posting_id: "test-" + Date.now(),
  company_id: "test-company-id",
  company_name: "Test Company",
  company_email: "test@company.com",
  hr_email: "hr@company.com",
  job_title: "Test Web Designer",
  job_description: "This is a test job posting to verify webhook functionality after fixing the n8n configuration.",
  required_skills: ["HTML", "CSS", "JavaScript", "Testing"],
  interview_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  interview_meeting_link: "https://meet.google.com/test",
  google_calendar_link: "https://calendar.google.com/test",
  metadata: {
    timestamp: new Date().toISOString(),
    source: "webhook-test-script",
    version: "1.0",
    event_type: "test_webhook_fix"
  }
};

async function testWebhook() {
  console.log('🧪 Testing webhook after n8n configuration fix...');
  console.log('📤 Test payload:', JSON.stringify(testPayload, null, 2));
  
  try {
    // Test the internal webhook endpoint
    const response = await fetch('http://localhost:3000/api/webhooks/n8n-outgoing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Source': 'test-script',
      },
      body: JSON.stringify(testPayload),
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log('📊 Response body:', result);

    if (response.ok) {
      console.log('✅ Webhook test successful! The n8n configuration fix worked.');
      console.log('🎉 You can now create job postings without the "Unused Respond to Webhook node" error.');
    } else {
      console.log('❌ Webhook test failed. Check the error message above.');
      console.log('💡 Make sure you have:');
      console.log('   1. Changed the n8n webhook Response Mode to "When Last Node Finishes"');
      console.log('   2. Saved and activated your n8n workflow');
      console.log('   3. Your Next.js application is running on localhost:3000');
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('💡 Make sure your Next.js application is running on localhost:3000');
  }
}

// Run the test
testWebhook();
