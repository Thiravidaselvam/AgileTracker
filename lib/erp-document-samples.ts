const HR = "═".repeat(60)

function header(docNum: number, title: string, preparedBy: string) {
  return `ERP SOFTWARE IMPLEMENTATION
${title.toUpperCase()}
${HR}
Document #   : ${docNum}
Document     : ${title}
Project Name : [Project Name]
Client       : [Client Name]
Prepared By  : ${preparedBy}
Reviewed By  : [Name]
Date         : ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
Version      : 1.0
Status       : Draft
${HR}

`
}

function signoff() {
  return `
${HR}
SIGN-OFF

Prepared By   : _________________________ Date: __________
Reviewed By   : _________________________ Date: __________
Approved By   : _________________________ Date: __________
Client POC    : _________________________ Date: __________
${HR}
`
}

export const ERP_SAMPLES: Record<number, { filename: string; content: string }> = {
  1: {
    filename: "01_Project_Charter.txt",
    content: header(1, "Project Charter", "Project Manager") + `
1. PROJECT OVERVIEW
   Project Name     : [Project Name]
   Client           : [Client Name]
   ERP Software     : [ERP Software Name]
   Implementing Co  : [Your Company Name]
   Project Manager  : [PM Name]
   Start Date       : [DD-MM-YYYY]
   Go-Live Date     : [DD-MM-YYYY]

2. PROJECT OBJECTIVES
   a) Replace existing legacy system with modern ERP solution
   b) Streamline business processes across all departments
   c) Improve data accuracy, reporting, and decision-making
   d) Ensure seamless integration between all business modules

3. SCOPE OF WORK
   Modules in scope:
   [ ] Finance & Accounting
   [ ] Human Resource & Payroll
   [ ] Inventory & Warehouse Management
   [ ] Sales & CRM
   [ ] Purchase & Procurement
   [ ] Production / Manufacturing
   [ ] Reports & Dashboard

   Out of Scope:
   - [List any exclusions]

4. BUDGET & RESOURCES
   Total Budget     : [Amount]
   Project Team     : [List team members]
   Client Team      : [List client contacts]

5. HIGH-LEVEL MILESTONES
   Phase 1 - Pre-Implementation   : [Date Range]
   Phase 2 - Project Planning     : [Date Range]
   Phase 3 - Configuration        : [Date Range]
   Phase 4 - Testing              : [Date Range]
   Phase 5 - Training             : [Date Range]
   Phase 6 - Go-Live              : [Date]
   Phase 7 - Post Go-Live Support : [Date Range]

6. ASSUMPTIONS & CONSTRAINTS
   Assumptions:
   - Client will provide timely feedback and sign-offs
   - Key users will be available for UAT
   - Infrastructure will be ready by Phase 2

   Constraints:
   - Go-Live date is fixed as [Date]
   - [Any other constraints]

7. RISKS
   - Scope creep (Mitigation: Formal CR process)
   - Data quality issues (Mitigation: Early data audit)
   - Resource unavailability (Mitigation: Plan in advance)
` + signoff(),
  },

  2: {
    filename: "02_Scope_of_Work.txt",
    content: header(2, "Scope of Work (SOW)", "Project Manager") + `
1. INTRODUCTION
   This document defines the scope of ERP implementation services
   to be delivered by [Your Company Name] to [Client Name].

2. SERVICES INCLUDED
   2.1 Pre-Implementation
       - Kick-off meeting and project planning
       - Requirement gathering and gap analysis

   2.2 Configuration & Customization
       - Base system configuration
       - Custom module development (as per gap analysis)
       - Third-party integrations

   2.3 Data Migration
       - Data extraction, cleansing, and migration
       - Data validation and sign-off

   2.4 Testing
       - Unit testing, SIT, and UAT support

   2.5 Training
       - End-user training (department-wise)
       - Training material preparation

   2.6 Go-Live Support
       - Go-live execution and monitoring

   2.7 Post Go-Live Support
       - Hypercare support for [30/60/90] days

3. SERVICES EXCLUDED
   - Hardware procurement
   - Network setup
   - Third-party software licensing (unless specified)
   - [Any other exclusions]

4. DELIVERABLES
   All deliverables are listed in the Required Documentation Checklist
   (Document #28 - Go-Live Checklist).

5. ACCEPTANCE CRITERIA
   - All UAT test cases pass
   - Data migration validated by client
   - Training completed for all users
   - Client sign-off obtained

6. PAYMENT TERMS
   Milestone 1 - Project Kick-off     : [Amount] ([%])
   Milestone 2 - Configuration Done   : [Amount] ([%])
   Milestone 3 - UAT Sign-off         : [Amount] ([%])
   Milestone 4 - Go-Live              : [Amount] ([%])
   Milestone 5 - Project Closure      : [Amount] ([%])
` + signoff(),
  },

  3: {
    filename: "03_Project_Plan_Gantt.txt",
    content: header(3, "Project Plan / Gantt Chart", "Project Manager") + `
1. PROJECT TIMELINE OVERVIEW

   Phase                              | Start Date  | End Date    | Duration | Owner
   -----------------------------------|-------------|-------------|----------|------------------
   Phase 1: Pre-Implementation        | [Date]      | [Date]      | [x] days | Project Manager
     - Kick-off Meeting               | [Date]      | [Date]      | 1 day    | PM
     - Requirement Gathering          | [Date]      | [Date]      | [x] days | Functional Consult
     - Gap Analysis                   | [Date]      | [Date]      | [x] days | Functional Consult
   Phase 2: Project Planning          | [Date]      | [Date]      | [x] days | Project Manager
     - Project Plan Finalization      | [Date]      | [Date]      | [x] days | PM
     - Infrastructure Setup           | [Date]      | [Date]      | [x] days | Sys Admin
   Phase 3: Configuration             | [Date]      | [Date]      | [x] days | Technical Lead
     - Base Configuration             | [Date]      | [Date]      | [x] days | Functional Consult
     - Master Data Setup              | [Date]      | [Date]      | [x] days | Client Teams
     - Customization & Development    | [Date]      | [Date]      | [x] days | Developer
     - Data Migration                 | [Date]      | [Date]      | [x] days | Technical Lead
   Phase 4: Testing                   | [Date]      | [Date]      | [x] days | QA Lead
     - Unit Testing                   | [Date]      | [Date]      | [x] days | Developer
     - SIT                            | [Date]      | [Date]      | [x] days | QA Lead
     - UAT                            | [Date]      | [Date]      | [x] days | Client + FC
   Phase 5: Training                  | [Date]      | [Date]      | [x] days | Functional Consult
   Phase 6: Go-Live                   | [Date]      | [Date]      | 1-3 days | All Teams
   Phase 7: Post Go-Live Support      | [Date]      | [Date]      | [x] days | Support Team

2. KEY MILESTONES
   Milestone                         | Target Date  | Status
   ----------------------------------|--------------|--------
   Requirement Gathering Complete    | [Date]       | Pending
   Gap Analysis Sign-off             | [Date]       | Pending
   Configuration Complete            | [Date]       | Pending
   UAT Sign-off                      | [Date]       | Pending
   Go-Live                           | [Date]       | Pending
   Post Go-Live Support End          | [Date]       | Pending

3. CRITICAL PATH
   [List the critical dependencies that could delay the project]
   1. BRD sign-off → Configuration start
   2. Configuration complete → UAT start
   3. UAT sign-off → Go-Live approval

4. BUFFER & CONTINGENCY
   Total buffer built into plan: [x] days
   Contingency reserve: [x] days
` + signoff(),
  },

  4: {
    filename: "04_Resource_Allocation_Plan.txt",
    content: header(4, "Resource Allocation Plan", "Project Manager") + `
1. PROJECT TEAM - IMPLEMENTING PARTNER

   Role                  | Name       | Allocation | Phase(s)          | Contact
   ----------------------|------------|------------|-------------------|------------------
   Project Manager       | [Name]     | 100%       | All phases        | [email/phone]
   Functional Consultant | [Name]     | 100%       | P1, P2, P3, P4, P5| [email/phone]
   Technical Lead        | [Name]     | 100%       | P2, P3, P4        | [email/phone]
   Developer             | [Name]     | 100%       | P3, P4            | [email/phone]
   QA Analyst            | [Name]     | 100%       | P4                | [email/phone]
   System Admin          | [Name]     | 50%        | P2, P6            | [email/phone]
   Trainer               | [Name]     | 100%       | P5                | [email/phone]
   Support Engineer      | [Name]     | 100%       | P7                | [email/phone]

2. CLIENT TEAM

   Role                  | Name       | Department  | Availability      | Contact
   ----------------------|------------|-------------|-------------------|------------------
   Client POC / Sponsor  | [Name]     | Management  | As needed         | [email/phone]
   Finance Lead          | [Name]     | Finance     | Full-time P3, P4  | [email/phone]
   HR Lead               | [Name]     | HR          | Full-time P3, P4  | [email/phone]
   Sales Lead            | [Name]     | Sales       | Full-time P3, P4  | [email/phone]
   Purchase Lead         | [Name]     | Purchase    | Full-time P3, P4  | [email/phone]
   Inventory Lead        | [Name]     | Warehouse   | Full-time P3, P4  | [email/phone]
   IT / Infra            | [Name]     | IT          | As needed         | [email/phone]

3. RESOURCE CALENDAR
   [Attach calendar showing resource availability, holidays, leaves]

4. ESCALATION MATRIX
   Level 1  : Functional Consultant → Project Manager (same day)
   Level 2  : Project Manager → Delivery Head (within 24 hrs)
   Level 3  : Delivery Head → Client Sponsor (within 48 hrs)
` + signoff(),
  },

  5: {
    filename: "05_Risk_Register.txt",
    content: header(5, "Risk Register", "Project Manager") + `
   #  | Risk Description                          | Probability | Impact | Score | Mitigation Strategy              | Owner    | Status
   ---|-------------------------------------------|-------------|--------|-------|----------------------------------|----------|--------
   1  | Scope creep - uncontrolled change requests| High        | High   | 9     | Formal CR process with sign-off  | PM       | Open
   2  | Data quality issues during migration      | High        | High   | 9     | Early data audit and cleansing   | Tech Lead| Open
   3  | Key client users unavailable for UAT      | Medium      | High   | 6     | Schedule UAT well in advance     | PM       | Open
   4  | Infrastructure delays                     | Medium      | High   | 6     | Finalize infra in Phase 1        | Sys Admin| Open
   5  | Resistance to change by end users         | Medium      | Medium | 4     | Change management and training   | FC       | Open
   6  | Integration failure with 3rd party systems| Low         | High   | 3     | Detailed integration testing     | Dev      | Open
   7  | Go-Live date slip                         | Medium      | High   | 6     | Buffer weeks in project plan     | PM       | Open
   8  | Key team member unavailability            | Low         | High   | 3     | Cross-training and documentation | PM       | Open
   9  | Client sign-off delays                    | Medium      | Medium | 4     | Weekly follow-ups and reminders  | PM       | Open
   10 | Network/security issues post go-live       | Low         | High   | 3     | Pre-go-live infra testing        | IT       | Open

RISK SCORING MATRIX:
   Probability: High=3, Medium=2, Low=1
   Impact: High=3, Medium=2, Low=1
   Score = Probability × Impact (Critical=9, High=6, Medium=4, Low=3/2/1)

RISK REVIEW FREQUENCY: Weekly during project, Monthly post go-live
` + signoff(),
  },

  6: {
    filename: "06_Communication_Plan.txt",
    content: header(6, "Communication Plan", "Project Manager") + `
1. COMMUNICATION OBJECTIVES
   - Keep all stakeholders informed of project progress
   - Ensure timely escalation of issues and risks
   - Maintain transparency between client and implementation team

2. STAKEHOLDER COMMUNICATION MATRIX

   Communication Type      | Frequency  | Medium           | From           | To                    | Owner
   ------------------------|------------|------------------|----------------|-----------------------|-------
   Project Status Report   | Weekly     | Email + Meeting  | PM             | All stakeholders      | PM
   Steering Committee Mtg  | Monthly    | Video/In-person  | PM + Sponsor   | Steering Committee    | PM
   Technical Review        | Bi-weekly  | Meeting          | Tech Lead      | Technical teams       | TL
   UAT Progress Update     | Daily (UAT)| Email            | FC             | Client POC + PM       | FC
   Go-Live Readiness Review| Pre Go-Live| Meeting          | PM             | All stakeholders      | PM
   Hypercare Daily Standup | Daily (P7) | Call/Chat        | Support Eng    | Client IT + PM        | SE
   Issue Escalation        | As needed  | Email + Call     | Anyone         | Relevant stakeholders | PM

3. COMMUNICATION CHANNELS
   Primary     : Email ([project-email@company.com])
   Meetings    : [MS Teams / Zoom / Google Meet]
   Chat        : [WhatsApp Group / Slack / Teams Channel]
   Document    : [SharePoint / Google Drive / Project Folder]
   Issue Track : [Jira / This Tracker]

4. MEETING SCHEDULE
   Weekly Status Call  : Every [Day] at [Time]
   Monthly Review      : [Date] of each month at [Time]
   Location / Link     : [Meeting Link]

5. REPORTING TEMPLATE
   Each weekly report will cover:
   - Completed tasks this week
   - Planned tasks next week
   - Issues / Risks raised
   - Decisions required
   - % completion by phase
` + signoff(),
  },

  7: {
    filename: "07_Business_Requirement_Document_BRD.txt",
    content: header(7, "Business Requirement Document (BRD)", "Functional Consultant") + `
1. EXECUTIVE SUMMARY
   [Brief overview of the business need and ERP implementation goal]

2. CURRENT STATE (AS-IS) OVERVIEW
   Current systems in use: [Legacy system name(s)]
   Major pain points:
   - Manual processes and data re-entry
   - Lack of real-time visibility
   - Disconnected systems across departments
   - Poor reporting capabilities

3. BUSINESS REQUIREMENTS BY MODULE

   3.1 FINANCE & ACCOUNTING
   REQ-FIN-001: System shall support multi-currency transactions
   REQ-FIN-002: System shall support GST / TDS / TCS tax calculation
   REQ-FIN-003: System shall generate P&L, Balance Sheet, Trial Balance
   REQ-FIN-004: System shall support bank reconciliation
   REQ-FIN-005: System shall support multiple cost centers
   [Add more requirements]

   3.2 HUMAN RESOURCES & PAYROLL
   REQ-HR-001: System shall manage employee master data
   REQ-HR-002: System shall process monthly payroll with salary components
   REQ-HR-003: System shall calculate statutory deductions (PF, ESI, PT)
   REQ-HR-004: System shall manage leave and attendance
   [Add more requirements]

   3.3 INVENTORY & WAREHOUSE
   REQ-INV-001: System shall track stock by warehouse and location
   REQ-INV-002: System shall support FIFO/LIFO/Average costing
   REQ-INV-003: System shall generate stock aging reports
   REQ-INV-004: System shall support barcode/QR scanning
   [Add more requirements]

   3.4 SALES & CRM
   REQ-SAL-001: System shall manage customer master and price lists
   REQ-SAL-002: System shall process sales orders and invoices
   REQ-SAL-003: System shall support credit limit management
   REQ-SAL-004: System shall track sales team performance
   [Add more requirements]

   3.5 PURCHASE & PROCUREMENT
   REQ-PUR-001: System shall manage vendor master and price lists
   REQ-PUR-002: System shall process purchase orders and GRN
   REQ-PUR-003: System shall support 3-way matching (PO-GRN-Invoice)
   [Add more requirements]

4. NON-FUNCTIONAL REQUIREMENTS
   - System must support [x] concurrent users
   - Page load time must be < 3 seconds
   - Data backup every 24 hours
   - 99.9% uptime SLA

5. CONSTRAINTS & ASSUMPTIONS
   [List known constraints and assumptions]
` + signoff(),
  },

  8: {
    filename: "08_Functional_Requirement_Specification_FRS.txt",
    content: header(8, "Functional Requirement Specification (FRS)", "Functional Consultant") + `
1. PURPOSE
   This document provides detailed functional specifications derived from
   the Business Requirement Document (BRD).

2. FUNCTIONAL SPECIFICATIONS

   2.1 FINANCE MODULE

   FRS-FIN-001: Chart of Accounts
   Description  : System shall allow configuration of multi-level COA
   Input        : Account code, name, type, parent group
   Process      : Validate uniqueness; create ledger hierarchy
   Output       : COA tree view; account ledger report
   Priority     : Must Have
   Dependency   : None

   FRS-FIN-002: Journal Entry
   Description  : System shall allow manual journal entry posting
   Input        : Date, account codes, debit/credit amounts, narration
   Process      : Validate debit = credit; post to ledger
   Output       : Posted entry with voucher number; audit trail
   Priority     : Must Have
   Dependency   : FRS-FIN-001

   FRS-FIN-003: GST Computation
   Description  : Auto-compute GST (CGST/SGST/IGST) on transactions
   Input        : HSN/SAC code, transaction value, state of supply
   Process      : Determine tax type and rate; compute tax amount
   Output       : Tax breakup on invoice; GSTR reports
   Priority     : Must Have
   Dependency   : Tax master setup

   [Repeat for all modules and requirements]

3. SCREEN FLOW DIAGRAMS
   [Attach or describe screen flows for key processes]

4. REPORT REQUIREMENTS
   Report Name              | Format | Frequency | Users
   -------------------------|--------|-----------|------------------
   Trial Balance            | PDF    | Monthly   | Finance Team
   Sales Register           | Excel  | Weekly    | Sales Manager
   Stock Summary            | Excel  | Daily     | Warehouse Team
   Payroll Summary          | PDF    | Monthly   | HR Manager
   Vendor Aging             | Excel  | Weekly    | Purchase Team
` + signoff(),
  },

  9: {
    filename: "09_AS-IS_Process_Document.txt",
    content: header(9, "AS-IS Process Document", "Functional Consultant") + `
1. PURPOSE
   Documents the current (existing) business processes before ERP implementation.

2. CURRENT SYSTEM LANDSCAPE
   System/Tool         | Department  | Usage
   --------------------|-------------|----------------------------------
   [Legacy ERP/Excel]  | Finance     | Accounting, invoicing, reports
   [Excel/Manual]      | HR          | Payroll, attendance, leave
   [Excel/Manual]      | Inventory   | Stock tracking, purchase orders
   [CRM/Excel]         | Sales       | Order management, customer data
   [Manual/Paper]      | Purchase    | PO, GRN, vendor payments

3. AS-IS PROCESS FLOWS

   3.1 SALES ORDER PROCESS (CURRENT)
   Step 1: Customer places order via phone/email
   Step 2: Sales team manually enters order in Excel
   Step 3: Availability checked manually with warehouse
   Step 4: Order confirmed to customer via phone
   Step 5: Delivery challan created in Excel/Word
   Step 6: Invoice generated manually
   Step 7: Payment tracked in separate Excel sheet
   Pain Points:
   - Manual data re-entry (error-prone)
   - No real-time stock visibility
   - Delays in invoice generation

   3.2 PURCHASE ORDER PROCESS (CURRENT)
   Step 1: Warehouse identifies reorder need manually
   Step 2: Purchase team raises PO in Excel
   Step 3: PO sent to vendor via email/fax
   Step 4: Goods received and matched manually
   Step 5: Invoice approved manually and sent to Finance
   Step 6: Payment processed via bank
   Pain Points:
   - No 3-way matching
   - Manual approval process
   - Delayed payments due to paper trail

   3.3 PAYROLL PROCESS (CURRENT)
   Step 1: Attendance collected from registers/biometric
   Step 2: Manually entered into Excel for calculation
   Step 3: Salary computed with manual deductions
   Step 4: Bank transfer list prepared manually
   Step 5: Payslips generated in Word
   Pain Points:
   - Time-consuming manual calculation
   - High risk of errors
   - No employee self-service

4. PROCESS METRICS (CURRENT)
   Process              | Time Taken  | Error Rate | Staff Involved
   ---------------------|-------------|------------|---------------
   Invoice Generation   | 2-3 hours   | ~5%        | 2 staff
   Payroll Processing   | 3-5 days    | ~3%        | 3 staff
   Stock Report         | 1-2 hours   | ~10%       | 1 staff
` + signoff(),
  },

  10: {
    filename: "10_TO-BE_Process_Document.txt",
    content: header(10, "TO-BE Process Document", "Functional Consultant") + `
1. PURPOSE
   Documents the future (to-be) business processes after ERP implementation.

2. TO-BE PROCESS FLOWS

   2.1 SALES ORDER PROCESS (TO-BE WITH ERP)
   Step 1: Customer places order (portal / phone / email)
   Step 2: Sales team creates Sales Order in ERP
   Step 3: System auto-checks stock availability in real-time
   Step 4: Approval workflow triggers (if order > threshold)
   Step 5: Delivery note auto-generated on stock confirmation
   Step 6: Invoice auto-generated on delivery
   Step 7: Payment tracked in ERP; customer ledger updated automatically
   Benefits:
   - Real-time stock visibility
   - Auto invoicing (saves 2 hours/day)
   - Complete audit trail

   2.2 PURCHASE ORDER PROCESS (TO-BE WITH ERP)
   Step 1: System triggers reorder alert when stock < reorder level
   Step 2: Purchase team creates PO in ERP from suggested orders
   Step 3: PO approval workflow (auto email to approver)
   Step 4: Approved PO sent to vendor from ERP
   Step 5: GRN created in ERP on goods receipt
   Step 6: System auto-matches PO-GRN-Invoice (3-way matching)
   Step 7: Approved invoice auto-posted to accounts payable
   Benefits:
   - Automated 3-way matching
   - Digital approval workflow
   - Faster vendor payments

   2.3 PAYROLL PROCESS (TO-BE WITH ERP)
   Step 1: Attendance auto-imported from biometric integration
   Step 2: Payroll run with one click (auto calculation)
   Step 3: System computes all statutory deductions automatically
   Step 4: Bank transfer file generated for bulk payment
   Step 5: Payslips auto-emailed to employees
   Step 6: Statutory reports (PF, ESI, PT) auto-generated
   Benefits:
   - Reduces 3-5 days to 2-3 hours
   - Zero manual calculation errors
   - Employee self-service portal

3. PROCESS IMPROVEMENT SUMMARY
   Process              | Current Time | ERP Time  | Time Saved | Error Reduction
   ---------------------|--------------|-----------|------------|----------------
   Invoice Generation   | 2-3 hours    | 5 mins    | ~95%       | ~99%
   Payroll Processing   | 3-5 days     | 2-3 hours | ~95%       | ~99%
   Stock Report         | 1-2 hours    | Real-time | ~99%       | ~99%
   Month-end Closing    | 5-7 days     | 1-2 days  | ~70%       | ~90%
` + signoff(),
  },

  11: {
    filename: "11_Gap_Analysis_Report.txt",
    content: header(11, "Gap Analysis Report", "Functional Consultant") + `
1. PURPOSE
   Identifies gaps between standard ERP features and client requirements,
   and defines customization/development work required.

2. GAP ANALYSIS SUMMARY
   Total Requirements Analyzed: [x]
   Available Out-of-the-Box   : [x] ([y]%)
   Needs Configuration        : [x] ([y]%)
   Needs Customization/Dev    : [x] ([y]%)

3. DETAILED GAP ANALYSIS

   #  | Requirement       | Module    | OOB | Config | Custom | Priority | Notes
   ---|-------------------|-----------|-----|--------|--------|----------|------------------
   1  | Multi-currency    | Finance   | Yes | No     | No     | High     | Available std
   2  | GST computation   | Finance   | Yes | Yes    | No     | High     | GST setup needed
   3  | Custom report A   | Finance   | No  | No     | Yes    | High     | Dev required
   4  | Barcode scanning  | Inventory | No  | No     | Yes    | Medium   | Integration needed
   5  | Payroll formula   | HR        | No  | Yes    | No     | High     | Config rules
   6  | WhatsApp alerts   | All       | No  | No     | Yes    | Low      | API integration
   7  | Custom dashboard  | Reports   | No  | No     | Yes    | Medium   | Dev required
   [Add all requirements]

4. CUSTOMIZATION SCOPE

   4.1 MUST-HAVE CUSTOMIZATIONS
   #  | Feature           | Module    | Effort (Days) | Developer
   ---|-------------------|-----------|---------------|----------
   1  | [Feature]         | [Module]  | [x] days      | [Name]
   2  | [Feature]         | [Module]  | [x] days      | [Name]

   4.2 NICE-TO-HAVE CUSTOMIZATIONS (Future Phase)
   #  | Feature           | Module    | Effort (Days) | Phase
   ---|-------------------|-----------|---------------|------
   1  | [Feature]         | [Module]  | [x] days      | 2
   2  | [Feature]         | [Module]  | [x] days      | 2

5. IMPACT ON TIMELINE & COST
   Standard Configuration    : Included in base cost
   Custom Development Total  : [x] days = [Amount]
   Impact on Timeline        : [x] additional days
` + signoff(),
  },

  12: {
    filename: "12_System_Design_Document.txt",
    content: header(12, "System Design Document (SDD)", "Technical Lead") + `
1. SYSTEM ARCHITECTURE

   1.1 DEPLOYMENT MODEL
   [ ] On-Premise   [ ] Cloud (SaaS)   [ ] Hybrid

   Server Configuration:
   Application Server : [Specs: CPU, RAM, Storage]
   Database Server    : [Specs: CPU, RAM, Storage]
   Web Server         : [Specs]
   Backup Server      : [Specs]

   1.2 ENVIRONMENT SETUP
   Environment  | URL/IP           | Purpose
   -------------|------------------|---------------------------
   DEV          | http://dev.[x]   | Development & config work
   QA           | http://qa.[x]    | Testing and UAT
   PROD         | http://[x]       | Live operations

2. TECHNOLOGY STACK
   ERP Application  : [ERP Name & Version]
   Database         : [PostgreSQL/MySQL/MSSQL] [Version]
   Web Server       : [Apache/Nginx/IIS]
   OS               : [Ubuntu/Windows Server]
   Backup Tool      : [Tool Name]

3. SECURITY ARCHITECTURE
   - SSL/TLS encryption for all web traffic
   - Role-based access control (RBAC)
   - Password policy: [Min length, complexity, expiry]
   - Session timeout: [x] minutes
   - IP whitelisting for admin access
   - Audit trail for all transactions

4. INTEGRATION ARCHITECTURE
   External System      | Integration Type | Frequency | Direction
   ---------------------|------------------|-----------|----------
   Bank / Payment       | API (REST)       | Real-time | Bi-directional
   Biometric Device     | File/API         | Daily     | Inbound
   E-commerce Platform  | API (REST)       | Real-time | Bi-directional
   Email / SMTP         | SMTP             | Real-time | Outbound

5. NETWORK DIAGRAM
   [Attach network diagram showing servers, firewalls, user access]

6. BACKUP & RECOVERY
   Backup Type     | Frequency | Retention | Storage Location
   ----------------|-----------|-----------|------------------
   Full Backup     | Daily     | 30 days   | [Location]
   Transaction Log | Hourly    | 7 days    | [Location]
   Offsite Copy    | Weekly    | 90 days   | [Cloud/Offsite]

   RTO (Recovery Time Objective) : [x] hours
   RPO (Recovery Point Objective): [x] hours
` + signoff(),
  },

  13: {
    filename: "13_Database_Design_ER_Diagram.txt",
    content: header(13, "Database Design / ER Diagram", "Technical Lead") + `
1. DATABASE OVERVIEW
   Database Name    : [DB Name]
   Database Engine  : [PostgreSQL/MySQL/MSSQL]
   Version          : [Version]
   Character Set    : UTF-8
   Collation        : [Collation]

2. KEY ENTITIES & RELATIONSHIPS

   CORE TABLES:
   - Company        : Master company configuration
   - Branch         : Company branches
   - User           : System users and roles
   - FiscalYear     : Financial year definition

   FINANCE TABLES:
   - ChartOfAccounts: Account master (code, name, type, group)
   - JournalVoucher : All financial transactions
   - JournalEntry   : Debit/credit lines per voucher
   - Customer       : Customer master
   - Vendor         : Vendor/supplier master
   - Invoice        : Sales invoices
   - Bill           : Purchase bills

   INVENTORY TABLES:
   - ItemMaster     : Product/item master
   - Warehouse      : Warehouse/location master
   - StockEntry     : Stock movements (IN/OUT)
   - StockBalance   : Real-time stock balance

   HR TABLES:
   - Employee       : Employee master
   - SalaryStructure: Salary components definition
   - PayrollEntry   : Monthly payroll records
   - LeaveRecord    : Leave applications and approvals
   - Attendance     : Daily attendance records

3. ER DIAGRAM
   [Attach ER diagram image or link to draw.io/Lucidchart diagram]

   Key Relationships:
   - Company (1) ──< Branch (N)
   - Branch (1) ──< User (N)
   - Customer (1) ──< Invoice (N)
   - Invoice (1) ──< InvoiceLine (N)
   - ItemMaster (1) ──< StockEntry (N)
   - Employee (1) ──< PayrollEntry (N)

4. INDEXING STRATEGY
   Table              | Index Columns           | Type
   -------------------|-------------------------|-------
   JournalEntry       | voucher_id, account_code| Composite
   StockEntry         | item_code, posting_date | Composite
   Invoice            | customer_id, date       | Composite
` + signoff(),
  },

  14: {
    filename: "14_Integration_Design_Document.txt",
    content: header(14, "Integration Design Document", "Technical Lead") + `
1. INTEGRATION OVERVIEW
   This document describes all third-party integrations for the ERP system.

2. INTEGRATION LIST

   Integration #1: BANK / PAYMENT GATEWAY
   System         : [Bank Name / Payment Gateway]
   Type           : REST API
   Direction      : Bi-directional
   Trigger        : On payment/receipt creation in ERP
   Frequency      : Real-time
   Auth Method    : API Key / OAuth 2.0
   Endpoint       : [API Endpoint URL]
   Data Exchanged : Payment orders, status updates, bank statements
   Error Handling : Retry 3 times; alert on failure

   Integration #2: BIOMETRIC ATTENDANCE DEVICE
   System         : [Device Brand/Model]
   Type           : File Export / SDK
   Direction      : Inbound (Device → ERP)
   Trigger        : Scheduled job (daily at [time])
   Frequency      : Daily
   Data Format    : CSV / XML
   Data Exchanged : Employee attendance punches
   Error Handling : Log errors; manual correction workflow

   Integration #3: E-COMMERCE PLATFORM
   System         : [Platform Name]
   Type           : REST API / Webhook
   Direction      : Bi-directional
   Trigger        : New order / status change
   Frequency      : Real-time
   Data Exchanged : Orders, inventory levels, fulfillment status

   Integration #4: EMAIL (SMTP)
   System         : [SMTP Provider]
   Type           : SMTP
   Direction      : Outbound
   Usage          : Notifications, invoices, payslips, alerts

3. DATA MAPPING
   Integration     | Source Field        | Target Field        | Transform
   ----------------|---------------------|---------------------|----------
   Bank            | transaction_id      | payment_reference   | None
   Bank            | amount              | paid_amount         | Currency convert
   Biometric       | emp_id              | employee_code       | Lookup table
   E-commerce      | order_number        | sales_order_id      | Prefix "EC-"

4. INTEGRATION TESTING PLAN
   Each integration will be tested in DEV → QA → PROD sequence.
   Test scenarios defined in SIT Test Cases (Document #20).
` + signoff(),
  },

  15: {
    filename: "15_Data_Migration_Plan.txt",
    content: header(15, "Data Migration Plan & Mapping Sheet", "Technical Lead") + `
1. MIGRATION OVERVIEW
   Source System    : [Legacy System Name]
   Target System    : [ERP Name]
   Migration Method : Excel Upload / API / Script
   Test Migration   : [Date]
   Final Migration  : Go-Live Date [Date]

2. DATA MIGRATION SCOPE

   Data Type              | Records | Method        | Responsible     | Status
   -----------------------|---------|---------------|-----------------|--------
   Customer Master        | [count] | Excel Upload  | Sales Team      | Pending
   Vendor Master          | [count] | Excel Upload  | Purchase Team   | Pending
   Item / Product Master  | [count] | Excel Upload  | Inventory Team  | Pending
   Employee Master        | [count] | Excel Upload  | HR Team         | Pending
   Chart of Accounts      | [count] | Excel Upload  | Finance Team    | Pending
   Opening Stock          | [count] | Excel Upload  | Inventory Team  | Pending
   Opening Balances       | [count] | Manual Entry  | Finance Team    | Pending
   Historical Transactions| [count] | Script/API    | Technical Lead  | Pending

3. DATA MAPPING SHEET

   3.1 CUSTOMER MASTER MAPPING
   Source Field (Legacy)  | Target Field (ERP)    | Mandatory | Notes
   -----------------------|-----------------------|-----------|------------------
   CUST_CODE              | customer_id           | Yes       | Unique
   CUST_NAME              | customer_name         | Yes       |
   CUST_ADDRESS           | address_line_1        | No        |
   CUST_CITY              | city                  | No        |
   CUST_PHONE             | mobile                | No        |
   CUST_CREDIT_LIMIT      | credit_limit          | No        |
   CUST_GSTIN             | gstin                 | No        | Validate format

4. DATA CLEANSING RULES
   - Remove duplicate records (keep most recent)
   - Standardize phone number format: +91-XXXXXXXXXX
   - Standardize GSTIN format: 15 characters
   - Fill mandatory fields before migration
   - Set status = "Active" for all migrated records

5. MIGRATION CHECKLIST
   [ ] Data extract from legacy system complete
   [ ] Data cleansing complete
   [ ] Template populated and validated
   [ ] Test migration done in DEV
   [ ] Test migration done in QA
   [ ] Client validation of migrated data
   [ ] Issues resolved
   [ ] Final migration approved
   [ ] Final migration to PROD complete
   [ ] Post-migration validation complete
` + signoff(),
  },

  16: {
    filename: "16_Customization_Development_Spec.txt",
    content: header(16, "Customization / Development Specification", "Developer") + `
1. CUSTOMIZATION OVERVIEW

   Total Custom Items : [x]
   Estimated Effort   : [x] developer days
   Start Date         : [Date]
   Completion Date    : [Date]

2. CUSTOM DEVELOPMENT ITEMS

   DEV-001: [Custom Report / Module Name]
   Module       : [Finance / Inventory / HR / Sales]
   Priority     : High / Medium / Low
   Requirement  : [Reference to BRD / FRS requirement]
   Description  :
     [Detailed description of what needs to be built]
   Technical Approach:
     [Explain how it will be built - which tables, what logic]
   Input        : [What data/parameters are needed]
   Output       : [Report format / screen / API response]
   Estimated Effort: [x] days
   Developer    : [Name]
   Status       : Pending / In Progress / Done / Testing

   DEV-002: [Integration Name]
   Module       : [Module]
   Priority     : [Priority]
   Description  :
     [Integration details - see Integration Design Document #14]
   API Endpoint : [URL]
   Auth         : [Method]
   Estimated Effort: [x] days
   Developer    : [Name]
   Status       : Pending

   [Add entries for each customization from Gap Analysis Report]

3. CODE STANDARDS
   - All code must follow [coding standard / style guide]
   - Unit tests required for all custom functions
   - Code review mandatory before QA deployment
   - Version control: Git (branch naming: feature/DEV-XXX)

4. CODE REVIEW CHECKLIST
   [ ] Code follows naming conventions
   [ ] No hardcoded values
   [ ] Error handling implemented
   [ ] Logging implemented
   [ ] Unit tests written and passing
   [ ] No SQL injection vulnerabilities
   [ ] Performance tested with [x] records
   [ ] Reviewed by Tech Lead
` + signoff(),
  },

  17: {
    filename: "17_Configuration_Document.txt",
    content: header(17, "Configuration Document", "Functional Consultant") + `
1. COMPANY SETUP
   Company Name     : [Client Company Name]
   Company Logo     : [Uploaded]
   Address          : [Full Address]
   Country          : India
   Currency         : INR (Indian Rupee)
   Fiscal Year      : April to March (or [Custom])
   Date Format      : DD-MM-YYYY

2. TAX CONFIGURATION
   GST Registration No : [GSTIN]
   Tax Types Configured:
   - CGST (Central GST)  : 2.5%, 6%, 9%, 14%
   - SGST (State GST)    : 2.5%, 6%, 9%, 14%
   - IGST (Integrated)   : 5%, 12%, 18%, 28%
   - TDS on [category]   : [%]
   - TCS on [category]   : [%]

3. ORGANIZATIONAL STRUCTURE
   Branches Configured:
   - Head Office      : [Location]
   - Branch 1         : [Location]
   - [Add more]

   Departments:
   - Finance, HR, Sales, Purchase, Inventory, Operations, IT

   Cost Centers:
   - [List cost centers]

4. USER ROLES MATRIX
   Role Name            | Modules Accessible                        | Create | Edit | Delete | Approve
   ---------------------|-------------------------------------------|--------|------|--------|--------
   Super Admin          | All Modules                               | Yes    | Yes  | Yes    | Yes
   Finance Manager      | Finance, Reports                          | Yes    | Yes  | No     | Yes
   Accountant           | Finance                                   | Yes    | Yes  | No     | No
   Sales Manager        | Sales, CRM, Reports                       | Yes    | Yes  | No     | Yes
   Sales Executive      | Sales, CRM                                | Yes    | No   | No     | No
   Purchase Manager     | Purchase, Reports                         | Yes    | Yes  | No     | Yes
   Warehouse Staff      | Inventory                                 | Yes    | Yes  | No     | No
   HR Manager           | HR, Payroll, Reports                      | Yes    | Yes  | No     | Yes
   Read-Only User       | Reports only                              | No     | No   | No     | No

5. WORKFLOW / APPROVAL CONFIGURATION
   Transaction          | Approver 1         | Approver 2          | Limit
   ---------------------|--------------------|--------------------|------------------
   Sales Order > [Amt]  | Sales Manager      | Finance Manager     | > ₹[amount]
   Purchase Order       | Purchase Manager   | MD / Director       | > ₹[amount]
   Expense Claim        | Department Head    | Finance Manager     | All
   Leave Request        | HR Manager         | -                   | All

6. EMAIL CONFIGURATION
   SMTP Host    : [smtp.gmail.com / mail.company.com]
   Port         : 587 (TLS) / 465 (SSL)
   From Email   : [erp@company.com]
   Notifications: Order confirmation, Invoice, Low stock alert, Approval requests
` + signoff(),
  },

  18: {
    filename: "18_Test_Plan.txt",
    content: header(18, "Test Plan", "QA Lead") + `
1. TESTING SCOPE
   In Scope:
   - All configured ERP modules
   - Custom developments as per DEV items
   - Third-party integrations
   - User roles and permissions
   - Data migration accuracy

   Out of Scope:
   - Performance/load testing (unless specified)
   - Browser compatibility beyond [Chrome, Firefox, Edge]

2. TEST PHASES
   Phase        | Type              | Performed By      | Environment | Dates
   -------------|-------------------|-------------------|-------------|----------
   Unit Testing | Functional tests  | Developer         | DEV         | [Dates]
   SIT          | Integration tests | QA Lead + Dev     | QA          | [Dates]
   UAT          | Acceptance tests  | Client End Users  | QA          | [Dates]
   Regression   | Re-test fixes     | QA + Client       | QA          | [Dates]

3. TEST CASE NAMING CONVENTION
   Format: [MODULE]-[TYPE]-[NUMBER]
   Example: FIN-UAT-001 (Finance, UAT, case 001)
   Modules: FIN, HR, INV, SAL, PUR, PRD, REP

4. DEFECT SEVERITY DEFINITION
   Critical : System crash, data loss, unable to complete core transaction
   High     : Core feature broken, wrong calculation, wrong data saved
   Medium   : Minor feature not working, UI issue affecting workflow
   Low      : Cosmetic issue, typo, minor UI misalignment

5. DEFECT WORKFLOW
   Tester logs defect → Developer assigned → Developer fixes →
   Deployed to QA → Tester re-tests → Pass: Closed / Fail: Reopen

6. TEST EXIT CRITERIA
   - All Critical defects: 0 open
   - All High defects: 0 open (or accepted by client)
   - Medium defects: [x]% resolved
   - UAT sign-off obtained from client

7. TESTING TOOLS
   Bug Tracker    : [This ERP Tracker / Jira / Excel]
   Test Cases     : [Excel / TestRail / Confluence]
   Screen Capture : [Snipping Tool / Lightshot]
` + signoff(),
  },

  19: {
    filename: "19_Unit_Test_Cases.txt",
    content: header(19, "Unit Test Cases", "Developer") + `
UNIT TEST CASES - DEVELOPER TESTING
Environment: DEV | Performed By: Developer

   TC ID         | Module   | Feature              | Test Steps                           | Expected Result           | Status | Defect
   --------------|----------|----------------------|--------------------------------------|---------------------------|--------|--------
   UT-FIN-001    | Finance  | Create Journal Entry | 1. Open JV screen                    | JV saved with voucher no  | Pass   |
                 |          |                      | 2. Enter debit account & amount      | Dr = Cr validation passes |        |
                 |          |                      | 3. Enter credit account & amount     | Posted to ledger          |        |
                 |          |                      | 4. Save                              |                           |        |
   --------------|----------|----------------------|--------------------------------------|---------------------------|--------|--------
   UT-FIN-002    | Finance  | GST Calculation      | 1. Create sales invoice              | CGST+SGST computed        | Pass   |
                 |          |                      | 2. Select GST item (18% rate)        | CGST=9%, SGST=9%          |        |
                 |          |                      | 3. Enter qty and rate                | Tax amount = value × 18%  |        |
   --------------|----------|----------------------|--------------------------------------|---------------------------|--------|--------
   UT-INV-001    | Inventory| Stock Receipt        | 1. Create stock entry (IN)           | Stock increased in system | Pass   |
                 |          |                      | 2. Select item and warehouse         | Stock ledger updated      |        |
                 |          |                      | 3. Enter qty and valuation rate      |                           |        |
   --------------|----------|----------------------|--------------------------------------|---------------------------|--------|--------
   UT-SAL-001    | Sales    | Create Sales Order   | 1. Open Sales Order screen           | SO saved with SO number   | Pass   |
                 |          |                      | 2. Select customer                   | Customer details auto-fill|        |
                 |          |                      | 3. Add items with qty                | Price from price list     |        |
                 |          |                      | 4. Submit                            | Stock reserved            |        |
   --------------|----------|----------------------|--------------------------------------|---------------------------|--------|--------
   UT-HR-001     | HR       | Employee Creation    | 1. Open Employee master              | Employee saved with ID    | Pass   |
                 |          |                      | 2. Fill mandatory fields             | Salary structure assigned |        |
                 |          |                      | 3. Assign salary structure           |                           |        |
   [Add all unit test cases for each feature]

UNIT TEST SUMMARY:
   Total Test Cases : [x]
   Passed           : [x]
   Failed           : [x]
   Blocked          : [x]
   Pass Rate        : [x]%
` + signoff(),
  },

  20: {
    filename: "20_SIT_Test_Cases.txt",
    content: header(20, "SIT Test Cases", "QA Lead") + `
SYSTEM INTEGRATION TEST CASES
Environment: QA | Performed By: QA Lead + Developer

SCENARIO 1: SALES ORDER TO INVOICE FLOW
   Step | Action                          | Module    | Expected Result              | Status
   -----|----------------------------------|-----------|------------------------------|--------
   1    | Create Sales Order for Customer A| Sales     | SO-001 created               | Pass
   2    | Submit Sales Order               | Sales     | Approval workflow triggered  | Pass
   3    | Approve Sales Order              | Sales     | Status = Approved            | Pass
   4    | Create Delivery Note from SO     | Inventory | DN-001 created; stock deducted| Pass
   5    | Validate stock deduction         | Inventory | Stock decreased by order qty | Pass
   6    | Create Invoice from Delivery Note| Finance   | INV-001 created with amounts | Pass
   7    | Verify customer ledger updated   | Finance   | Receivable balance increased | Pass
   8    | Record customer payment          | Finance   | Payment linked to invoice    | Pass
   9    | Verify receivable cleared        | Finance   | Balance = 0 after payment    | Pass

SCENARIO 2: PURCHASE ORDER TO PAYMENT FLOW
   Step | Action                           | Module    | Expected Result              | Status
   -----|----------------------------------|-----------|------------------------------|--------
   1    | Create Purchase Order to Vendor B | Purchase  | PO-001 created               | Pass
   2    | Submit and approve PO            | Purchase  | PO status = Approved         | Pass
   3    | Create GRN (Goods Receipt Note)  | Inventory | GRN-001; stock increased     | Pass
   4    | Verify stock increased           | Inventory | Stock increased by GRN qty   | Pass
   5    | Create Purchase Bill from GRN    | Finance   | BILL-001 created             | Pass
   6    | 3-way match validation           | Finance   | PO-GRN-Bill amounts match    | Pass
   7    | Process vendor payment           | Finance   | Payment entry created        | Pass
   8    | Verify vendor ledger updated     | Finance   | Payable balance cleared      | Pass

SCENARIO 3: PAYROLL TO FINANCE INTEGRATION
   Step | Action                           | Module    | Expected Result              | Status
   -----|----------------------------------|-----------|------------------------------|--------
   1    | Process monthly payroll          | HR        | Payroll entries created      | Pass
   2    | Verify salary calculation        | HR        | Gross, deductions, net correct| Pass
   3    | Post payroll to accounts         | Finance   | Salary JV auto-created       | Pass
   4    | Verify expense accounts debited  | Finance   | Salary expense Dr entry      | Pass
   5    | Verify payable account credited  | Finance   | Salary payable Cr entry      | Pass
   6    | Process salary bank transfer     | Finance   | Bank payment entry created   | Pass

SIT SUMMARY:
   Total Scenarios  : [x]
   Total Test Cases : [x]
   Passed           : [x]
   Failed           : [x]  (see Defect Log)
   Pass Rate        : [x]%
` + signoff(),
  },

  21: {
    filename: "21_UAT_Test_Cases.txt",
    content: header(21, "UAT Test Cases", "Functional Consultant") + `
USER ACCEPTANCE TEST CASES
Environment: QA | Performed By: Client End Users
Instructions: Execute each test case as per your daily business workflow.
Mark PASS if result matches expected. Mark FAIL and describe actual result.

MODULE: FINANCE
   TC ID     | Scenario                    | Steps                              | Expected Result        | Actual Result | Status       | Remarks
   ----------|-----------------------------|------------------------------------|-----------------------|---------------|--------------|--------
   UAT-FIN-01| Create Sales Invoice        | 1. Go to Finance > Sales Invoice   | Invoice saved with no | ...           | Pass / Fail  |
             |                             | 2. Select customer                 | Tax computed correctly|               |              |
             |                             | 3. Add items                       |                       |               |              |
             |                             | 4. Verify tax amounts              |                       |               |              |
   UAT-FIN-02| View Customer Ledger        | 1. Go to Finance > Ledger Reports  | All transactions shown|               | Pass / Fail  |
             |                             | 2. Select customer                 | Correct balance shown |               |              |
             |                             | 3. Select date range               |                       |               |              |
   UAT-FIN-03| Generate Trial Balance      | 1. Go to Reports > Trial Balance   | All accounts listed   |               | Pass / Fail  |
             |                             | 2. Select period                   | Dr = Cr               |               |              |

MODULE: INVENTORY
   TC ID     | Scenario                    | Steps                              | Expected Result        | Actual Result | Status       | Remarks
   ----------|-----------------------------|------------------------------------|-----------------------|---------------|--------------|--------
   UAT-INV-01| Check Stock Balance         | 1. Go to Inventory > Stock Report  | Real-time qty shown   |               | Pass / Fail  |
   UAT-INV-02| Create Stock Transfer       | 1. Transfer item between warehouses| Stock moved correctly |               | Pass / Fail  |

MODULE: HR & PAYROLL
   TC ID     | Scenario                    | Steps                              | Expected Result        | Actual Result | Status       | Remarks
   ----------|-----------------------------|------------------------------------|-----------------------|---------------|--------------|--------
   UAT-HR-01 | View My Payslip             | 1. Login as employee               | Current month payslip |               | Pass / Fail  |
   UAT-HR-02 | Apply for Leave             | 1. Go to HR > Leave Application    | Leave applied & email |               | Pass / Fail  |

UAT SUMMARY:
   Total Test Cases : [x]
   Passed           : [x]
   Failed           : [x]
   Blocked          : [x]
   Pass Rate        : [x]%
   UAT Decision     : PASS / FAIL (pending sign-off)
` + signoff(),
  },

  22: {
    filename: "22_Defect_Bug_Tracker.txt",
    content: header(22, "Defect / Bug Tracker", "QA Lead") + `
DEFECT LOG

   #   | Defect ID  | Phase | Module    | Severity | Description                              | Steps to Reproduce              | Expected         | Actual           | Reported By | Date       | Assigned To | Status   | Fixed Date | Remarks
   ----|------------|-------|-----------|----------|------------------------------------------|---------------------------------|------------------|------------------|-------------|------------|-------------|----------|------------|--------
   1   | BUG-001    | SIT   | Finance   | High     | Tax calculation wrong for interstate sale| Create invoice with IGST item   | IGST = 18%       | CGST+SGST shown  | QA Lead     | [Date]     | Developer   | Fixed    | [Date]     | Config issue - fixed
   2   | BUG-002    | UAT   | Inventory | Medium   | Stock report not showing negative stock  | View stock for item X           | Show -ve qty red | Shows 0          | Client User | [Date]     | Developer   | Open     |            |
   3   | BUG-003    | UAT   | HR        | Low      | Payslip font too small on print          | Print payslip                   | Readable font 10 | Font size 7      | HR Manager  | [Date]     | Developer   | Fixed    | [Date]     | CSS fix done
   [Add all defects]

DEFECT SUMMARY:
   Phase   | Critical | High | Medium | Low | Total | Open | Fixed | Closed
   --------|----------|------|--------|-----|-------|------|-------|-------
   UT      | 0        | [x]  | [x]    | [x] | [x]   | 0    | [x]   | [x]
   SIT     | 0        | [x]  | [x]    | [x] | [x]   | 0    | [x]   | [x]
   UAT     | 0        | [x]  | [x]    | [x] | [x]   | [x]  | [x]   | [x]
   TOTAL   | 0        | [x]  | [x]    | [x] | [x]   | [x]  | [x]   | [x]

DEFECT RESOLUTION SLA:
   Critical : Must fix within 4 hours
   High     : Must fix within 8 hours
   Medium   : Fix within 24 hours
   Low      : Fix before Go-Live
` + signoff(),
  },

  23: {
    filename: "23_UAT_Sign-off_Document.txt",
    content: header(23, "UAT Sign-off Document", "Client POC") + `
USER ACCEPTANCE TESTING - OFFICIAL SIGN-OFF

This document certifies that User Acceptance Testing has been completed
for the ERP implementation project.

1. UAT SUMMARY
   Project Name     : [Project Name]
   UAT Start Date   : [Date]
   UAT End Date     : [Date]
   UAT Environment  : [QA Environment URL]

   MODULE-WISE SIGN-OFF:
   Module               | Test Cases | Passed | Failed (Open) | Sign-off
   ---------------------|------------|--------|---------------|------------------
   Finance & Accounting | [x]        | [x]    | 0             | [Signature / Date]
   HR & Payroll         | [x]        | [x]    | 0             | [Signature / Date]
   Inventory & WMS      | [x]        | [x]    | 0             | [Signature / Date]
   Sales & CRM          | [x]        | [x]    | 0             | [Signature / Date]
   Purchase             | [x]        | [x]    | 0             | [Signature / Date]
   Reports & Dashboard  | [x]        | [x]    | 0             | [Signature / Date]
   TOTAL                | [x]        | [x]    | 0             |

2. KNOWN ISSUES (ACCEPTED FOR GO-LIVE)
   #  | Defect ID | Description              | Severity | Agreed Fix Date
   ---|-----------|--------------------------|----------|----------------
   1  | BUG-XXX   | [Description]            | Low      | [Date]
   [Any accepted open items with agreed fix dates]

3. UAT SIGN-OFF DECLARATION
   We, the undersigned, confirm that User Acceptance Testing has been
   completed satisfactorily and we approve the system for Go-Live.

   CLIENT SIGN-OFF:
   Name           : _________________________
   Designation    : _________________________
   Department     : _________________________
   Signature      : _________________________
   Date           : _________________________

   IMPLEMENTING PARTNER SIGN-OFF:
   Name           : _________________________
   Designation    : Project Manager
   Company        : [Your Company Name]
   Signature      : _________________________
   Date           : _________________________
` + signoff(),
  },

  24: {
    filename: "24_Training_Plan.txt",
    content: header(24, "Training Plan", "Functional Consultant") + `
1. TRAINING OVERVIEW
   Training Period    : [Start Date] to [End Date]
   Environment        : QA / PROD (as decided)
   Training Method    : Hands-on + Presentation
   Recording          : Yes (all sessions recorded)

2. TRAINING SCHEDULE

   Session | Module              | Target Users          | Date     | Time          | Trainer  | Duration | Venue
   --------|---------------------|----------------------|----------|---------------|----------|----------|------------------
   1       | Finance & Accounting | Accounts Team (5)    | [Date]   | 10:00-14:00   | [Name]   | 4 Hours  | [Location/Link]
   2       | HR & Payroll        | HR Team (3)           | [Date]   | 10:00-14:00   | [Name]   | 4 Hours  | [Location/Link]
   3       | Sales & CRM         | Sales Team (8)        | [Date]   | 10:00-13:00   | [Name]   | 3 Hours  | [Location/Link]
   4       | Purchase            | Purchase Team (4)     | [Date]   | 10:00-13:00   | [Name]   | 3 Hours  | [Location/Link]
   5       | Inventory & WMS     | Warehouse Team (6)    | [Date]   | 10:00-13:00   | [Name]   | 3 Hours  | [Location/Link]
   6       | Admin & Reports     | IT / Management (4)   | [Date]   | 10:00-12:00   | [Name]   | 2 Hours  | [Location/Link]
   7       | Refresher / Q&A     | All users             | [Date]   | 11:00-12:00   | [Name]   | 1 Hour   | [Location/Link]

3. TRAINING CONTENT BY MODULE

   Finance Training Agenda:
   - Login and navigation overview (15 min)
   - Chart of Accounts and ledger setup (20 min)
   - Journal entries and vouchers (30 min)
   - Sales invoicing and receipts (30 min)
   - Purchase bills and payments (30 min)
   - GST reports and returns (30 min)
   - Financial reports (Trial Balance, P&L, BS) (30 min)
   - Q&A (15 min)

4. TRAINING PREREQUISITES
   - All users must have login credentials created
   - Training environment must have sample data
   - User manuals distributed before each session
   - Projector / screen sharing tool ready

5. TRAINING EVALUATION
   Each user will complete a short test after training.
   Pass mark: 70%
   Users below 70% will receive additional 1-on-1 session.
` + signoff(),
  },

  25: {
    filename: "25_User_Manual.txt",
    content: header(25, "User Manual (Module-wise)", "Functional Consultant") + `
ERP USER MANUAL
[This is a sample structure - full manual should include screenshots]

═══════════════════════════════════════
CHAPTER 1: GETTING STARTED
═══════════════════════════════════════

1.1 SYSTEM ACCESS
   URL       : http://[your-erp-url]
   Browser   : Chrome (recommended), Firefox, Edge
   Login     : Enter your email and password
   First Time: Change password on first login

1.2 DASHBOARD OVERVIEW
   After login, you will see the main dashboard with:
   - Quick access menu on the left sidebar
   - Key metrics and KPIs on the home screen
   - Notifications icon (top right)
   - User profile and logout (top right)

1.3 GENERAL NAVIGATION
   - Click menu items to open modules
   - Use the search bar to find records quickly
   - Breadcrumb trail shows your current location
   - Use Back button or breadcrumb to navigate back

═══════════════════════════════════════
CHAPTER 2: FINANCE MODULE
═══════════════════════════════════════

2.1 CREATING A SALES INVOICE
   Step 1: Go to Finance → Sales → Sales Invoice
   Step 2: Click "New Invoice"
   Step 3: Select Customer from dropdown
   Step 4: Select Invoice Date
   Step 5: Add items in the table:
           - Select Item
           - Enter Quantity
           - Rate will auto-populate from price list
           - Tax will auto-compute
   Step 6: Review total amount
   Step 7: Click "Save" to save as draft
   Step 8: Click "Submit" to finalize
   Note: Once submitted, invoice cannot be edited. Use Credit Note for corrections.

2.2 RECORDING A CUSTOMER PAYMENT
   Step 1: Go to Finance → Payments → Payment Receipt
   Step 2: Select Customer
   Step 3: Select "Against Invoice" and select invoice
   Step 4: Enter amount received
   Step 5: Select Bank Account
   Step 6: Save and Submit

═══════════════════════════════════════
CHAPTER 3: INVENTORY MODULE
═══════════════════════════════════════

3.1 CHECKING STOCK
   Step 1: Go to Inventory → Reports → Stock Balance
   Step 2: Filter by item, warehouse, or date
   Step 3: Export to Excel if needed

3.2 CREATING A STOCK ENTRY (TRANSFER)
   Step 1: Go to Inventory → Stock Entry
   Step 2: Select Type: "Material Transfer"
   Step 3: Select Source Warehouse and Target Warehouse
   Step 4: Add items with quantity
   Step 5: Save and Submit

═══════════════════════════════════════
CHAPTER 4: HR & PAYROLL
═══════════════════════════════════════

4.1 APPLYING FOR LEAVE
   Step 1: Go to HR → Leave → Leave Application
   Step 2: Select Leave Type
   Step 3: Select From Date and To Date
   Step 4: Enter Reason
   Step 5: Submit (your manager will receive email for approval)

4.2 VIEWING YOUR PAYSLIP
   Step 1: Go to HR → Payroll → My Payslip
   Step 2: Select month
   Step 3: Click Download PDF

[Continue for all modules...]
` + signoff(),
  },

  26: {
    filename: "26_Quick_Reference_Guide.txt",
    content: header(26, "Quick Reference Guide (QRG)", "Functional Consultant") + `
╔══════════════════════════════════════════════════════════════╗
║           ERP QUICK REFERENCE GUIDE - 1 PAGE CHEAT SHEET    ║
║           [Print and keep at your desk]                      ║
╚══════════════════════════════════════════════════════════════╝

SYSTEM URL   : http://[your-erp-url]
SUPPORT      : [support@company.com] | [Phone Number]
HELP DESK    : [Internal extension]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINANCE QUICK STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Create Sales Invoice   → Finance → Sales → Sales Invoice → New
Create Purchase Bill   → Finance → Purchase → Purchase Bill → New
Record Payment         → Finance → Payments → New Payment
View Ledger            → Finance → Reports → Account Ledger
Trial Balance          → Finance → Reports → Trial Balance
Journal Entry          → Finance → Accounting → Journal Voucher

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INVENTORY QUICK STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Check Stock            → Inventory → Reports → Stock Balance
Stock Transfer         → Inventory → Stock Entry → Material Transfer
Goods Receipt          → Inventory → Purchase Receipt → New
Issue Material         → Inventory → Stock Entry → Material Issue
Item Master            → Inventory → Items → Item List

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HR & PAYROLL QUICK STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Apply Leave            → HR → Leave → Leave Application → New
View Payslip           → HR → Payroll → My Payslip
Attendance             → HR → Attendance → Mark Attendance
Employee Details       → HR → Employee → Employee List

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SALES QUICK STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
New Sales Order        → Sales → Orders → Sales Order → New
Create Delivery        → Open SO → Actions → Create Delivery Note
Create Invoice         → Open Delivery Note → Actions → Create Invoice
Customer Ledger        → Finance → Reports → Account Ledger (Customer)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PURCHASE QUICK STEPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
New Purchase Order     → Purchase → Orders → Purchase Order → New
Receive Goods (GRN)    → Open PO → Actions → Create GRN
Create Bill            → Open GRN → Actions → Create Bill
Vendor Ledger          → Finance → Reports → Account Ledger (Vendor)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMMON SHORTCUTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Search anything        → Press Ctrl+F or use top search bar
Print/PDF              → Click Print icon on any document
Export Excel           → Click Export button on any list/report
Logout                 → Click your name (top right) → Logout
Change Password        → Click your name → My Profile → Change Password
` + signoff(),
  },

  27: {
    filename: "27_Training_Attendance_Sheet.txt",
    content: header(27, "Training Attendance Sheet", "Project Manager") + `
TRAINING ATTENDANCE REGISTER

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SESSION 1: FINANCE MODULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Date     : [Date]     Time: [Time]    Duration: 4 Hours
Trainer  : [Name]     Venue: [Location/Online Link]
Module   : Finance & Accounting

   #  | Name                 | Department | Designation       | Sign / Initial | Feedback (1-5)
   ---|----------------------|------------|-------------------|----------------|---------------
   1  |                      | Finance    |                   |                |
   2  |                      | Finance    |                   |                |
   3  |                      | Finance    |                   |                |
   4  |                      | Finance    |                   |                |
   5  |                      | Finance    |                   |                |
   [Add more rows]

Trainer Signature: _________________________ Date: __________
Total Attended: _____ out of _____ invited

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SESSION 2: HR & PAYROLL MODULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Date     : [Date]     Time: [Time]    Duration: 4 Hours
Trainer  : [Name]     Venue: [Location/Online Link]

   #  | Name                 | Department | Designation       | Sign / Initial | Feedback (1-5)
   ---|----------------------|------------|-------------------|----------------|---------------
   1  |                      | HR         |                   |                |
   2  |                      | HR         |                   |                |
   [Add more rows]

Trainer Signature: _________________________ Date: __________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SESSION 3-6: [Repeat format for each session]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRAINING COMPLETION SUMMARY:
   Module               | Invited | Attended | %    | Avg Feedback
   ---------------------|---------|----------|------|-------------
   Finance              | [x]     | [x]      | [x]% | [x]/5
   HR & Payroll         | [x]     | [x]      | [x]% | [x]/5
   Sales & CRM          | [x]     | [x]      | [x]% | [x]/5
   Purchase             | [x]     | [x]      | [x]% | [x]/5
   Inventory            | [x]     | [x]      | [x]% | [x]/5
   Admin & Reports      | [x]     | [x]      | [x]% | [x]/5
   TOTAL                | [x]     | [x]      | [x]% | [x]/5
` + signoff(),
  },

  28: {
    filename: "28_Go-Live_Checklist.txt",
    content: header(28, "Go-Live Checklist", "Project Manager") + `
GO-LIVE READINESS CHECKLIST
Go-Live Date: [DD-MM-YYYY]    Go-Live Time: [09:00 AM]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1: PROJECT COMPLETION GATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   #  | Checklist Item                              | Status   | Owner                 | Date Completed
   ---|---------------------------------------------|----------|-----------------------|---------------
   1  | UAT Sign-off received from client           | [ ] Done | Client POC            |
   2  | All Critical & High defects resolved        | [ ] Done | Dev Lead              |
   3  | Final data migration completed              | [ ] Done | Technical Lead        |
   4  | Data validation approved by client          | [ ] Done | Functional Consultant |
   5  | Production environment ready and tested     | [ ] Done | Infrastructure Team   |
   6  | All users created with correct roles        | [ ] Done | System Admin          |
   7  | Email and notifications configured & tested | [ ] Done | System Admin          |
   8  | Backup configured and test restore done     | [ ] Done | Infrastructure Team   |
   9  | Training completed for all users            | [ ] Done | Trainer               |
   10 | SSL certificate valid and configured        | [ ] Done | System Admin          |
   11 | Go/No-Go approval from client received      | [ ] Done | Project Manager       |
   12 | Rollback plan documented and ready          | [ ] Done | Technical Lead        |
   13 | Support team briefed and on standby         | [ ] Done | Project Manager       |
   14 | Old system freeze plan communicated         | [ ] Done | Client IT             |
   15 | Monitoring and alerts configured            | [ ] Done | System Admin          |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GO / NO-GO DECISION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   [ ] GO     - All checklist items complete. Proceed with Go-Live.
   [ ] NO-GO  - Reason: _______________________________________
                New Date: ___________________________________

   Project Manager : _________________ Date: _________
   Client POC      : _________________ Date: _________
   Tech Lead       : _________________ Date: _________
` + signoff(),
  },

  29: {
    filename: "29_Cutover_Plan.txt",
    content: header(29, "Cutover Plan", "Technical Lead") + `
GO-LIVE CUTOVER PLAN
Go-Live Date  : [DD-MM-YYYY]
Cutover Start : T-Day (Day before Go-Live) at 06:00 PM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
T-DAY (CUTOVER DAY - DAY BEFORE GO-LIVE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Time       | Step | Activity                                | Owner               | Done
   -----------|------|----------------------------------------|---------------------|-----
   06:00 PM   | 1    | Communicate cutover start to all users | Project Manager     | [ ]
   06:00 PM   | 2    | Freeze old system (no data entry)      | Client IT           | [ ]
   06:00 PM   | 3    | Final report extraction from old system| Client Team         | [ ]
   07:00 PM   | 4    | Final data export from legacy system   | Technical Lead      | [ ]
   07:00 PM   | 5    | Run final data validation scripts      | Technical Lead      | [ ]
   08:00 PM   | 6    | Take backup of QA database             | System Admin        | [ ]
   09:00 PM   | 7    | Begin final data migration to PROD     | Technical Lead      | [ ]
   10:30 PM   | 8    | Data migration complete                | Technical Lead      | [ ]
   11:00 PM   | 9    | Data validation in PROD by Finance     | Functional Consult  | [ ]
   11:30 PM   | 10   | Data validation in PROD by other teams | Client Teams        | [ ]
   11:59 PM   | 11   | All validations complete; sign-off     | Project Manager     | [ ]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GO-LIVE DAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Time       | Step | Activity                                | Owner               | Done
   -----------|------|----------------------------------------|---------------------|-----
   08:00 AM   | 12   | Final system health check              | System Admin        | [ ]
   08:30 AM   | 13   | ERP opened for users                   | System Admin        | [ ]
   09:00 AM   | 14   | Users start first transactions in ERP  | All Users           | [ ]
   09:00 AM   | 15   | Support team on standby (all day)      | Support Team        | [ ]
   11:00 AM   | 16   | Morning status call with all teams     | Project Manager     | [ ]
   03:00 PM   | 17   | Afternoon status call                  | Project Manager     | [ ]
   06:00 PM   | 18   | End-of-day status review               | Project Manager     | [ ]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ROLLBACK PLAN (If Go-Live Fails)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Trigger    : If critical issues found within first 2 hours
   Decision   : PM + Client jointly decide rollback
   Action     : Restore old system from backup; communicate to users
   Old System : Reactivate old system from [backup location]
   ERP        : Take PROD backup for root cause analysis
   New Date   : Schedule new Go-Live within [x] weeks
` + signoff(),
  },

  30: {
    filename: "30_Go_No-Go_Approval.txt",
    content: header(30, "Go/No-Go Approval Sign-off", "Project Manager") + `
OFFICIAL GO / NO-GO APPROVAL FOR ERP GO-LIVE

Project Name   : [Project Name]
Client         : [Client Name]
ERP System     : [ERP Software Name]
Go-Live Date   : [DD-MM-YYYY]
Meeting Date   : [Date of Go/No-Go meeting]

GO/NO-GO CRITERIA ASSESSMENT:
   Criteria                              | Status      | Notes
   --------------------------------------|-------------|----------------------------------
   All Critical UAT cases passed         | [ ] Yes/No  |
   All High UAT cases passed             | [ ] Yes/No  |
   Data migration validated by client    | [ ] Yes/No  |
   Infrastructure ready and tested       | [ ] Yes/No  |
   Training completed (>80% attendance)  | [ ] Yes/No  |
   All users have login access           | [ ] Yes/No  |
   Backup and restore tested             | [ ] Yes/No  |
   Rollback plan ready                   | [ ] Yes/No  |
   Support team confirmed                | [ ] Yes/No  |
   Client management approval obtained   | [ ] Yes/No  |

FINAL DECISION:
   [ ] GO     - Proceed with Go-Live on [Date] at [Time]
   [ ] NO-GO  - Postpone Go-Live
                Reason: ________________________________
                New Proposed Date: ____________________

AUTHORIZED SIGNATURES:
   Client CEO / Sponsor   : _________________ Date: _________ Sign: ___________
   Client Project Manager : _________________ Date: _________ Sign: ___________
   Client IT Head         : _________________ Date: _________ Sign: ___________
   Implementing PM        : _________________ Date: _________ Sign: ___________
   Implementing Tech Lead : _________________ Date: _________ Sign: ___________
` + signoff(),
  },

  31: {
    filename: "31_Data_Migration_Sign-off.txt",
    content: header(31, "Data Migration Sign-off", "Technical Lead + Client") + `
DATA MIGRATION SIGN-OFF DOCUMENT

Migration Type : [ ] Test Migration   [ ] Final Migration (Go-Live)
Migration Date : [DD-MM-YYYY]
Migration Time : [Start: _____ ] [End: _____ ]

DATA MIGRATION VALIDATION RESULTS:
   Data Type              | Source Records | Migrated Records | Validated | Accuracy | Sign-off
   -----------------------|----------------|------------------|-----------|----------|----------
   Customer Master        | [count]        | [count]          | [ ] Yes   | [x]%     | [Name/Date]
   Vendor Master          | [count]        | [count]          | [ ] Yes   | [x]%     | [Name/Date]
   Item / Product Master  | [count]        | [count]          | [ ] Yes   | [x]%     | [Name/Date]
   Employee Master        | [count]        | [count]          | [ ] Yes   | [x]%     | [Name/Date]
   Chart of Accounts      | [count]        | [count]          | [ ] Yes   | [x]%     | [Name/Date]
   Opening Stock          | [count]        | [count]          | [ ] Yes   | [x]%     | [Name/Date]
   Opening Balances       | [count]        | [count]          | [ ] Yes   | [x]%     | [Name/Date]
   Historical Transactions| [count]        | [count]          | [ ] Yes   | [x]%     | [Name/Date]

VALIDATION METHODOLOGY:
   - Record count comparison (Source vs ERP)
   - Financial balance matching (Trial Balance check)
   - Random sample verification (10% records spot-checked)
   - Key master data verified by department heads

ISSUES FOUND DURING MIGRATION:
   #  | Issue Description      | Records Affected | Resolution         | Status
   ---|------------------------|------------------|--------------------|-------
   1  | [Issue]                | [x] records      | [How resolved]     | Resolved
   [None if no issues]

SIGN-OFF:
   Data migration is complete and validated. Approved for Go-Live.

   Technical Lead        : _________________ Date: _________
   Functional Consultant : _________________ Date: _________
   Client Finance Head   : _________________ Date: _________
   Client IT Head        : _________________ Date: _________
   Project Manager       : _________________ Date: _________
` + signoff(),
  },

  32: {
    filename: "32_Hypercare_Support_Log.txt",
    content: header(32, "Hypercare Support Log", "Support Team") + `
HYPERCARE SUPPORT LOG (First 30-90 Days Post Go-Live)
Go-Live Date : [Date]
Period       : [Date] to [Date]

SLA REFERENCE:
   Priority | Response Time | Resolution Time
   ---------|---------------|----------------
   Critical | 1 Hour        | 4 Hours
   High     | 2 Hours       | 8 Hours
   Medium   | 4 Hours       | 24 Hours
   Low      | 8 Hours       | 72 Hours

SUPPORT TICKET LOG:
   Ticket# | Date     | Time  | Reported By   | Module    | Priority | Issue Description                        | Response Time | Resolution Time | Resolution                     | Status  | Engineer
   --------|----------|-------|---------------|-----------|----------|------------------------------------------|---------------|-----------------|--------------------------------|---------|--------
   SUP-001 | [Date]   | [Time]| [Name]        | Finance   | High     | Unable to post journal entry             | 45 mins       | 3 hours         | User role permission added     | Closed  | [Name]
   SUP-002 | [Date]   | [Time]| [Name]        | Inventory | Medium   | Stock report not loading                 | 2 hours       | 6 hours         | DB query optimized             | Closed  | [Name]
   SUP-003 | [Date]   | [Time]| [Name]        | HR        | Low      | Payslip PDF font issue                   | 6 hours       | 18 hours        | Template updated               | Closed  | [Name]
   [Add all support tickets]

DAILY HEALTH CHECK LOG:
   Date     | Checked By    | System Status | DB Backup   | Performance | Issues Found | Notes
   ---------|---------------|---------------|-------------|-------------|--------------|------
   [Date]   | [Name]        | [ ] OK        | [ ] OK      | [ ] OK      | None         |
   [Date]   | [Name]        | [ ] OK        | [ ] OK      | [ ] OK      | [Issue]      |

WEEKLY SUMMARY:
   Week    | Tickets Raised | Resolved | SLA Met | Avg Resolution Time
   --------|----------------|----------|---------|--------------------
   Week 1  | [x]            | [x]      | [x]%    | [x] hours
   Week 2  | [x]            | [x]      | [x]%    | [x] hours
   Week 4  | [x]            | [x]      | [x]%    | [x] hours
` + signoff(),
  },

  33: {
    filename: "33_Known_Issues_Resolution_Tracker.txt",
    content: header(33, "Known Issues & Resolution Tracker", "Support Team") + `
KNOWN ISSUES AND RESOLUTION TRACKER

   Issue# | Date Logged | Module    | Priority | Description                                  | Workaround Available | Fix ETA  | Fixed Date | Status   | Notes
   -------|-------------|-----------|----------|----------------------------------------------|---------------------|----------|------------|----------|------
   KI-001 | [Date]      | Finance   | Medium   | PDF export of P&L cuts off last column        | Print landscape mode| [Date]   | [Date]     | Fixed    | CSS fix applied
   KI-002 | [Date]      | Inventory | Low      | Stock report takes >30 sec for 10K+ items     | Filter by warehouse | [Date]   |            | In Progress | Index optimization
   KI-003 | [Date]      | HR        | Low      | Leave balance shows wrong for new joiners     | Manual correction   | [Date]   |            | Open     | Formula review
   KI-004 | [Date]      | Sales     | Medium   | Credit limit alert not triggering on partial  | Manual check        | [Date]   |            | Open     | Logic fix needed
   [Add all known issues]

ISSUE CATEGORIES:
   [ ] Bug       - System behaving incorrectly
   [ ] Config    - Configuration needs adjustment
   [ ] Data      - Data issue in master/transaction
   [ ] Training  - User not trained for this feature
   [ ] Enhancement - Not a bug, requested improvement

RESOLUTION TRACKING SUMMARY:
   Status       | Count | %
   -------------|-------|-----
   Open         | [x]   | [x]%
   In Progress  | [x]   | [x]%
   Fixed        | [x]   | [x]%
   Closed       | [x]   | [x]%
   TOTAL        | [x]   | 100%

ESCALATION POLICY:
   If Open > 7 days  → Escalate to Tech Lead
   If Open > 14 days → Escalate to Project Manager
   If Open > 30 days → Board-level review
` + signoff(),
  },

  34: {
    filename: "34_SLA_AMC_Support_Agreement.txt",
    content: header(34, "SLA / AMC Support Agreement", "Project Manager") + `
ANNUAL MAINTENANCE CONTRACT (AMC) & SERVICE LEVEL AGREEMENT (SLA)

This agreement is entered into between:
   Implementing Partner : [Your Company Name] ("Service Provider")
   Client               : [Client Name] ("Client")

Effective Date  : [Go-Live Date + 1 day]
Contract Period : 1 Year (renewable annually)
Contract Value  : ₹[Amount] per annum

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. SERVICES COVERED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   [ ] Bug fixes and error corrections
   [ ] Minor enhancements (up to [x] hours/month)
   [ ] Software version upgrades
   [ ] Database backup monitoring
   [ ] Monthly performance review
   [ ] User addition/modification
   [ ] Phone and email support
   [ ] Remote access support

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. SERVICE LEVEL AGREEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Priority  | Definition                  | Response Time | Resolution Time | Penalty (if missed)
   ----------|-----------------------------|---------------|-----------------|--------------------
   P1-Critical| System down, data loss      | 1 Hour        | 4 Hours         | [Penalty clause]
   P2-High   | Core function not working   | 2 Hours       | 8 Hours         | [Penalty clause]
   P3-Medium | Partial impact              | 4 Hours       | 24 Hours        | [Penalty clause]
   P4-Low    | Minor/cosmetic              | 8 Hours       | 72 Hours        | None

   Support Hours: [9 AM - 6 PM, Monday to Saturday]
   After Hours  : Emergency contact [Phone Number] (P1 only)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. EXCLUSIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   - Issues caused by client-side hardware/network failure
   - New feature development (requires separate CR and billing)
   - Third-party software issues
   - User training (charged separately)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. CONTRACT SIGNATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   For [Your Company Name]:
   Name      : _________________________
   Sign      : _________________________
   Date      : _________________________

   For [Client Name]:
   Name      : _________________________
   Sign      : _________________________
   Date      : _________________________
   Company Seal: [Seal Here]
`,
  },

  35: {
    filename: "35_Project_Closure_Report.txt",
    content: header(35, "Project Closure Report", "Project Manager") + `
PROJECT CLOSURE REPORT

1. PROJECT SUMMARY
   Project Name     : [Project Name]
   Client           : [Client Name]
   ERP Implemented  : [ERP Software Name]
   Project Start    : [Date]
   Go-Live Date     : [Date]
   Support End Date : [Date]
   Status           : CLOSED

2. OBJECTIVES ACHIEVED
   Objective                                        | Status     | Notes
   -------------------------------------------------|------------|------------------
   Legacy system replaced with ERP                  | [ ] Done   |
   Business processes streamlined                   | [ ] Done   |
   Data migrated successfully                       | [ ] Done   |
   All users trained                                | [ ] Done   |
   Integration with third-party systems done        | [ ] Done   |
   Go-Live completed successfully                   | [ ] Done   |

3. SCOPE SUMMARY
   Modules Delivered:
   [ ] Finance & Accounting     [ ] HR & Payroll
   [ ] Inventory & WMS          [ ] Sales & CRM
   [ ] Purchase & Procurement   [ ] Production
   [ ] Reports & Dashboard

   Customizations Delivered: [x] out of [x] planned
   Integrations Delivered   : [x] out of [x] planned

4. PROJECT METRICS
   Metric                  | Planned      | Actual       | Variance
   ------------------------|--------------|--------------|----------
   Duration                | [x] months   | [x] months   | [+/-x]
   Budget                  | ₹[amount]    | ₹[amount]    | [+/-x]
   Team Size               | [x] people   | [x] people   | [+/-x]
   Total Defects Found     | -            | [x]          | -
   Defect Resolution Rate  | 100%         | [x]%         | -

5. LESSONS LEARNED
   What went well:
   - [List 3-5 things that worked well]

   What could be improved:
   - [List 3-5 improvement areas for future projects]

6. OUTSTANDING ITEMS
   #  | Item                  | Owner    | Target Date
   ---|-----------------------|----------|------------
   1  | [Any pending items]   | [Name]   | [Date]

7. FORMAL CLOSURE SIGN-OFF
   All deliverables have been completed, accepted, and handed over.
   The project is formally closed.

   Project Manager       : _________________ Date: _________
   Technical Lead        : _________________ Date: _________
   Client Project Manager: _________________ Date: _________
   Client Sponsor        : _________________ Date: _________
` + signoff(),
  },

  36: {
    filename: "36_Handover_Document.txt",
    content: header(36, "Handover Document", "Technical Lead") + `
ERP SYSTEM HANDOVER DOCUMENT
Handover Date : [Date]
Handed Over By: [Technical Lead Name] ([Your Company])
Handed Over To: [Client IT Head Name] ([Client])

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. SYSTEM ACCESS CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   [Note: Share passwords via secure channel, NOT in this document]

   System Component        | URL / Access Point         | Admin User      | Password Location
   ------------------------|----------------------------|-----------------|------------------
   ERP Application (PROD)  | http://[prod-url]          | admin@[domain]  | [Password vault]
   ERP Application (QA)    | http://[qa-url]            | admin@[domain]  | [Password vault]
   Database Server         | [IP:Port]                  | [DB Admin user] | [Password vault]
   Server / SSH            | [IP Address]               | [Server user]   | [Password vault]
   Domain / DNS            | [Registrar URL]            | [Account]       | [Password vault]
   SSL Certificate         | Expires: [Date]            | [Account]       | [Password vault]
   Email Account           | [SMTP/Email admin]         | [Account]       | [Password vault]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. INFRASTRUCTURE DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Server Name     : [Server hostname]
   Server IP       : [IP Address]
   OS              : [OS Name & Version]
   RAM             : [x] GB
   Storage         : [x] GB ([x] GB used)
   Database        : [DB Name & Version]
   App Version     : [ERP Version]
   Last Update     : [Date]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. BACKUP & RESTORE PROCEDURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Backup Schedule : Daily at [Time]
   Backup Location : [Path / Cloud location]
   Backup Retention: 30 days full, 7 days transaction logs

   To restore backup:
   Step 1: [Command / Procedure]
   Step 2: [Command / Procedure]
   Step 3: Verify application starts correctly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. KEY CONTACTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Role                    | Name       | Email                    | Phone
   ------------------------|------------|--------------------------|------------------
   Account Manager         | [Name]     | [email]                  | [phone]
   Technical Support       | [Name]     | [email]                  | [phone]
   Emergency Hotline       | -          | support@[company].com    | [phone]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. DOCUMENTS HANDOVER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   All 36 project documents have been handed over via [Shared Drive / Email].
   Technical documentation location: [Path / Drive Link]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. HANDOVER SIGN-OFF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Handed Over By:
   Name      : _________________________ Date: _________
   Sign      : _________________________

   Received By:
   Name      : _________________________ Date: _________
   Sign      : _________________________
` + signoff(),
  },
}
