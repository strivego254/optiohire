# 🔐 Admin Management Guide - Complete System Access

## 📋 Table of Contents
1. [Admin Access & Authentication](#admin-access--authentication)
2. [Admin Dashboard Overview](#admin-dashboard-overview)
3. [User Management](#user-management)
4. [Company Management](#company-management)
5. [Job Postings Management](#job-postings-management)
6. [Applications Management](#applications-management)
7. [Regular Dashboard Access](#regular-dashboard-access)
8. [All Available Actions & Buttons](#all-available-actions--buttons)

---

## 🔑 Admin Access & Authentication

### Login as Admin
1. **Direct Admin Login URL:**
   ```
   http://localhost:3000/admin/login?email=YOUR_ADMIN_EMAIL&password=YOUR_ADMIN_PASSWORD
   ```

2. **Manual Login:**
   - Navigate to: `/admin/login`
   - Email: `YOUR_ADMIN_EMAIL`
   - Password: `YOUR_ADMIN_PASSWORD`
   - Click "Sign In"

3. **After Login:**
   - You'll be redirected to `/admin` dashboard
   - Admin token is stored in localStorage
   - All admin routes are protected with `requireAdmin` middleware

---

## 📊 Admin Dashboard Overview

### Access Path
- **URL:** `/admin`
- **Direct Link:** Click "Admin Dashboard" in sidebar (if visible) or navigate manually

### Dashboard Features
1. **System Statistics Cards:**
   - Total Users (with active count and admin count)
   - Total Companies
   - Total Job Postings (with active count)
   - Total Applications (with shortlisted count)

2. **Quick Action Buttons:**
   - **Manage Users** → `/admin/users`
   - **Manage Companies** → `/admin/companies`
   - **Manage Jobs** → `/admin/jobs`
   - **Manage Applications** → `/admin/applications`

---

## 👥 User Management

### Access Path
- **URL:** `/admin/users`
- **From Dashboard:** Click "Manage Users" button

### Available Actions

#### 1. View All Users
- **Action:** Page loads automatically
- **Features:**
  - Lists all users with pagination (20 per page)
  - Shows: Email, Role, Status, Created Date
  - Search by email (real-time filtering)

#### 2. Search Users
- **Button/Location:** Search bar at top
- **Action:** Type email to filter
- **Result:** Real-time filtered list

#### 3. Make User Admin
- **Button:** "Make Admin" (purple button with shield icon)
- **Location:** Next to each non-admin user
- **Action:** Click button
- **Result:** User role changes to 'admin'
- **Note:** Only visible for non-admin users

#### 4. Activate/Deactivate User
- **Button:** "Activate" or "Deactivate" (outline button)
- **Location:** Next to each user
- **Action:** Click to toggle
- **Result:** User status changes (active/inactive)
- **Effect:** Inactive users cannot sign in

#### 5. Delete User
- **Button:** "Delete" (red destructive button)
- **Location:** Right side of each user row
- **Action:** Click → Confirm in popup
- **Result:** User permanently deleted from system
- **Warning:** This action cannot be undone

#### 6. Pagination
- **Buttons:** "Previous" and "Next"
- **Location:** Bottom of user list
- **Action:** Click to navigate pages
- **Shows:** Current page and total pages

---

## 🏢 Company Management

### Access Path
- **URL:** `/admin/companies`
- **From Dashboard:** Click "Manage Companies" button

### Available Actions

#### 1. View All Companies
- **Action:** Page loads automatically
- **Features:**
  - Lists all companies with pagination (20 per page)
  - Shows: Company Name, Domain, Email, HR Email, Created Date
  - Search by company name (real-time filtering)

#### 2. Search Companies
- **Button/Location:** Search bar at top
- **Action:** Type company name to filter
- **Result:** Real-time filtered list

#### 3. View Company Details
- **Button:** "View Details" (outline button with eye icon)
- **Location:** Right side of each company row
- **Action:** Click button
- **Result:** Navigate to `/admin/companies/[companyId]`
- **Shows:** Full company information, associated jobs, applications

#### 4. Delete Company
- **Button:** "Delete" (red destructive button with trash icon)
- **Location:** Right side of each company row
- **Action:** Click → Confirm in popup
- **Result:** Company and ALL associated data deleted:
  - All job postings for this company
  - All applications for those jobs
  - Company record
- **Warning:** This is a CASCADE delete - all related data is removed

#### 5. Pagination
- **Buttons:** "Previous" and "Next"
- **Location:** Bottom of company list
- **Action:** Click to navigate pages

### Company Details Page (`/admin/companies/[companyId]`)
- **Access:** Click "View Details" on any company
- **Shows:**
  - Full company information
  - All job postings for this company
  - All applications
- **Actions:**
  - Edit company details
  - View individual jobs
  - View individual applications

---

## 💼 Job Postings Management

### Access Path
- **URL:** `/admin/jobs`
- **From Dashboard:** Click "Manage Jobs" button

### Available Actions

#### 1. View All Job Postings
- **Action:** Page loads automatically
- **Features:**
  - Lists all job postings with pagination (20 per page)
  - Shows: Job Title, Company, Status, Created Date, Deadline
  - Search by job title (real-time filtering)
  - Filter by status (All/Active/Closed/Draft)

#### 2. Search Jobs
- **Button/Location:** Search bar at top
- **Action:** Type job title to filter
- **Result:** Real-time filtered list

#### 3. Filter by Status
- **Dropdown:** Status filter dropdown
- **Location:** Next to search bar
- **Options:**
  - All Status (default)
  - Active
  - Closed
  - Draft
- **Action:** Select status from dropdown
- **Result:** List filtered by selected status

#### 4. Delete Job Posting
- **Button:** "Delete" (red destructive button with trash icon)
- **Location:** Right side of each job row
- **Action:** Click → Confirm in popup
- **Result:** Job posting and ALL associated applications deleted
- **Warning:** This action cannot be undone

#### 5. Pagination
- **Buttons:** "Previous" and "Next"
- **Location:** Bottom of job list
- **Action:** Click to navigate pages

---

## 📄 Applications Management

### Access Path
- **URL:** `/admin/applications`
- **From Dashboard:** Click "Manage Applications" button

### Available Actions

#### 1. View All Applications
- **Action:** Page loads automatically
- **Features:**
  - Lists all applications with pagination (20 per page)
  - Shows: Candidate Name, Email, Job Title, Company, AI Status, AI Score, Applied Date
  - Search by candidate name or email (real-time filtering)
  - Filter by AI status (All/Shortlisted/Flagged/Rejected)

#### 2. Search Applications
- **Button/Location:** Search bar at top
- **Action:** Type candidate name or email to filter
- **Result:** Real-time filtered list

#### 3. Filter by AI Status
- **Dropdown:** Status filter dropdown
- **Location:** Next to search bar
- **Options:**
  - All Status (default)
  - Shortlisted (green badge)
  - Flagged (yellow badge)
  - Rejected (red badge)
- **Action:** Select status from dropdown
- **Result:** List filtered by selected status

#### 4. View Application Details
- **Status Badges:** Color-coded badges show AI status
- **AI Score:** Displayed next to status (if available)
- **Information Shown:**
  - Candidate name and email
  - Job title and company
  - Application date
  - AI assessment status and score

#### 5. Delete Application
- **Button:** "Delete" (red destructive button with trash icon)
- **Location:** Right side of each application row
- **Action:** Click → Confirm in popup
- **Result:** Application permanently deleted
- **Warning:** This action cannot be undone

#### 6. Pagination
- **Buttons:** "Previous" and "Next"
- **Location:** Bottom of application list
- **Action:** Click to navigate pages

---

## 🎯 Regular Dashboard Access (Admin Can Access Everything)

### Access Path
- **URL:** `/dashboard`
- **Note:** Admin can access all regular user dashboard sections

### Available Sections

#### 1. Overview Section (`/dashboard`)
- **Access:** Click "Overview" in sidebar or navigate to `/dashboard`
- **Features:**
  - System statistics and metrics
  - Recent activity
  - Quick actions
- **Admin Rights:** Full access, can see all data

#### 2. Job Postings Section (`/dashboard/jobs`)
- **Access:** Click "Job Postings" in sidebar or navigate to `/dashboard/jobs`
- **Features:**
  - View all job postings
  - Create new job posting
  - Edit existing jobs
  - Delete jobs
  - View job details
  - See applicants for each job
- **Admin Rights:** 
  - Can create jobs for any company
  - Can view/edit/delete all jobs (not just own company's)
  - Full CRUD access

#### 3. Reports Section (`/dashboard/reports`)
- **Access:** Click "Reports & Analytics" in sidebar or navigate to `/dashboard/reports`
- **Features:**
  - View all reports
  - Generate new reports
  - Download reports
  - View report analytics
- **Admin Rights:** 
  - Can view all reports (all companies)
  - Can generate reports for any job
  - Full access to all analytics

#### 4. Interviews Section (`/dashboard/interviews`)
- **Access:** Click "Interviews" in sidebar or navigate to `/dashboard/interviews`
- **Features:**
  - View scheduled interviews
  - Schedule new interviews
  - Manage interview slots
  - Send interview invitations
- **Admin Rights:** 
  - Can schedule interviews for any application
  - Can view all scheduled interviews
  - Full management access

#### 5. Profile Section (`/dashboard/profile`)
- **Access:** Click "Profile" in sidebar or navigate to `/dashboard/profile`
- **Features:**
  - View account information
  - Update company information
  - Change password
  - Delete account
- **Admin Rights:** 
  - Can view own profile
  - Can update own settings
  - Note: Admin profile is separate from regular user profile

---

## 🎮 All Available Actions & Buttons

### Admin Dashboard (`/admin`)

| Button/Action | Location | Function | Result |
|--------------|----------|----------|--------|
| **Manage Users** | Quick Actions Grid | Navigate to user management | Opens `/admin/users` |
| **Manage Companies** | Quick Actions Grid | Navigate to company management | Opens `/admin/companies` |
| **Manage Jobs** | Quick Actions Grid | Navigate to job management | Opens `/admin/jobs` |
| **Manage Applications** | Quick Actions Grid | Navigate to application management | Opens `/admin/applications` |

### User Management (`/admin/users`)

| Button/Action | Location | Function | Result |
|--------------|----------|----------|--------|
| **Back** | Top left | Return to admin dashboard | Navigates to `/admin` |
| **Search** | Top search bar | Filter users by email | Real-time filtering |
| **Make Admin** | User row (purple button) | Promote user to admin | Role changes to 'admin' |
| **Activate/Deactivate** | User row (outline button) | Toggle user status | Status toggles active/inactive |
| **Delete** | User row (red button) | Delete user permanently | User removed from system |
| **Previous** | Bottom pagination | Go to previous page | Shows previous 20 users |
| **Next** | Bottom pagination | Go to next page | Shows next 20 users |

### Company Management (`/admin/companies`)

| Button/Action | Location | Function | Result |
|--------------|----------|----------|--------|
| **Back** | Top left | Return to admin dashboard | Navigates to `/admin` |
| **Search** | Top search bar | Filter companies by name | Real-time filtering |
| **View Details** | Company row (outline button) | View full company details | Opens `/admin/companies/[companyId]` |
| **Delete** | Company row (red button) | Delete company and all data | Cascade delete (jobs + applications) |
| **Previous** | Bottom pagination | Go to previous page | Shows previous 20 companies |
| **Next** | Bottom pagination | Go to next page | Shows next 20 companies |

### Job Postings Management (`/admin/jobs`)

| Button/Action | Location | Function | Result |
|--------------|----------|----------|--------|
| **Back** | Top left | Return to admin dashboard | Navigates to `/admin` |
| **Search** | Top search bar | Filter jobs by title | Real-time filtering |
| **Status Filter** | Dropdown next to search | Filter by job status | Filters: All/Active/Closed/Draft |
| **Delete** | Job row (red button) | Delete job and applications | Job + all applications deleted |
| **Previous** | Bottom pagination | Go to previous page | Shows previous 20 jobs |
| **Next** | Bottom pagination | Go to next page | Shows next 20 jobs |

### Applications Management (`/admin/applications`)

| Button/Action | Location | Function | Result |
|--------------|----------|----------|--------|
| **Back** | Top left | Return to admin dashboard | Navigates to `/admin` |
| **Search** | Top search bar | Filter by name/email | Real-time filtering |
| **Status Filter** | Dropdown next to search | Filter by AI status | Filters: All/Shortlisted/Flagged/Rejected |
| **Delete** | Application row (red button) | Delete application | Application permanently deleted |
| **Previous** | Bottom pagination | Go to previous page | Shows previous 20 applications |
| **Next** | Bottom pagination | Go to next page | Shows next 20 applications |

### Regular Dashboard - Jobs Section (`/dashboard/jobs`)

| Button/Action | Location | Function | Result |
|--------------|----------|----------|--------|
| **Refresh** | Top right | Reload job list | Refreshes all jobs |
| **Create New Job** | Top right | Open create job modal | Opens job creation form |
| **Edit** | Job card | Edit job posting | Opens edit modal |
| **Delete** | Job card | Delete job posting | Removes job (with confirmation) |
| **View Details** | Job card | View full job details | Opens job details modal |
| **View Applicants** | Job card | See all applicants | Shows applicant list |
| **View Report** | Job card | View job report | Opens report viewer |

### Regular Dashboard - Reports Section (`/dashboard/reports`)

| Button/Action | Location | Function | Result |
|--------------|----------|----------|--------|
| **Generate Report** | Report card | Create new report | Generates AI report |
| **View Report** | Report card | Open report viewer | Shows full report |
| **Download** | Report viewer | Download PDF | Downloads report as PDF |

### Regular Dashboard - Interviews Section (`/dashboard/interviews`)

| Button/Action | Location | Function | Result |
|--------------|----------|----------|--------|
| **Schedule Interview** | Application card | Schedule interview | Opens scheduling modal |
| **Reschedule** | Interview card | Change interview time | Updates interview time |
| **Cancel** | Interview card | Cancel interview | Removes interview |

### Regular Dashboard - Profile Section (`/dashboard/profile`)

| Button/Action | Location | Function | Result |
|--------------|----------|----------|--------|
| **Save Company Changes** | Company form | Update company info | Saves company details |
| **Change Password** | Security section | Open password form | Shows password change form |
| **Update Password** | Password form | Change password | Updates user password |
| **Delete Account** | Danger zone | Delete account | Permanently deletes account |

---

## 🔒 Admin Permissions Summary

### Full Access Rights:
✅ **Users:** View, Update Role, Activate/Deactivate, Delete
✅ **Companies:** View, View Details, Delete (with cascade)
✅ **Job Postings:** View, Delete (with cascade)
✅ **Applications:** View, Delete
✅ **Dashboard:** Full access to all sections
✅ **Reports:** View all, Generate for any job
✅ **Interviews:** Schedule for any application
✅ **System Stats:** View all statistics

### Admin-Only Features:
- Access to `/admin/*` routes
- View all users, companies, jobs, applications
- Modify user roles (make admin)
- Delete any entity in the system
- View system-wide statistics

---

## 🚨 Important Notes

1. **Cascade Deletes:**
   - Deleting a company deletes all its jobs and applications
   - Deleting a job deletes all its applications
   - Be careful with delete actions!

2. **Admin Role:**
   - Only admins can access `/admin/*` routes
   - Regular users get 403 Forbidden if they try
   - Admin status is checked on every admin route

3. **Token Authentication:**
   - All admin actions require valid JWT token
   - Token must include admin role
   - Token expires after 7 days (need to re-login)

4. **Data Persistence:**
   - All changes are saved immediately
   - No "Save" button needed for most actions
   - Deletions require confirmation

---

## 📝 Quick Reference

### Admin URLs:
- Dashboard: `/admin`
- Users: `/admin/users`
- Companies: `/admin/companies`
- Company Details: `/admin/companies/[companyId]`
- Jobs: `/admin/jobs`
- Applications: `/admin/applications`
- Login: `/admin/login`

### Regular Dashboard URLs (Admin can access):
- Overview: `/dashboard`
- Jobs: `/dashboard/jobs`
- Reports: `/dashboard/reports`
- Interviews: `/dashboard/interviews`
- Profile: `/dashboard/profile`

---

## ✅ Checklist for Admin Tasks

### Daily Tasks:
- [ ] Check system statistics on admin dashboard
- [ ] Review new user registrations
- [ ] Monitor job postings activity
- [ ] Check application volume

### Weekly Tasks:
- [ ] Review and manage user accounts
- [ ] Check for inactive companies
- [ ] Review job posting statuses
- [ ] Monitor application quality

### Monthly Tasks:
- [ ] Audit user roles and permissions
- [ ] Review company data
- [ ] Clean up old/inactive jobs
- [ ] Generate system reports

---

**Last Updated:** 2025-01-27
**Version:** 1.0

