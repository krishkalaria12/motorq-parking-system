# 🅿️ Mall Parking Management System

A **comprehensive full-stack web application** designed to streamline parking operations for a shopping mall. This system enables parking operators to efficiently manage vehicle entries, exits, slot assignments, billing, and analytics through a **modern, real-time dashboard**.

📹 **Video Demo**  
*<< [Video link](https://drive.google.com/file/d/16RyhBstYuA_L3bLzMaM09p8RIhCSqFSZ/view?usp=sharing) >>*

---

## ✨ Features

The application offers a tiered feature set, starting from core functionality to advanced operational intelligence.

---

### 🔹 Level 0: Core Parking Operations

- **Real-time Dashboard**: Instant overview of total, available, occupied, and maintenance slots.
- **Vehicle Check-In**: Register vehicle entries with number plate and type.
- **Smart Slot Assignment**: Automatically assigns the nearest available slot based on vehicle type (e.g., Cars → Regular/Compact, EVs → EV slots).
- **Manual Override**: Operators can override the system suggestion and assign slots manually.
- **Live Search & Filter**: Filter current parked vehicles by type or search by number plate.
- **Slot Management**: Toggle slot status between "Available" and "Maintenance".
- **Bulk Slot Creation**: Developer tool to bulk-create parking slots for quick setup.

---

### 🔸 Level 1: Duration Tracking & Session Management

- **Live Duration Counter**: Auto-updating timer for each active session.
- **Automated Timestamps**: Accurate entry and exit times for each vehicle.
- **Instant Slot Availability**: Slots marked as "Available" immediately upon vehicle exit.

---

### 💳 Level 2: Pricing & Billing

- **Dual Billing System**: Choose between *Hourly* or *Day Pass*.
- **Automated Fee Calculation**:
  - **Day Pass**: Fixed fee recorded at entry.
  - **Hourly**: Fee calculated based on a configurable rate slab and total parked time.
- **Billing Analytics Dashboard**:
  - Revenue summaries for **Today**, **This Week**, and **This Month**.
  - Visual bar chart + detailed tabular data.
  - Transaction history with pagination.

---

### 🆓 Bonus Level: Automated Session Management

- **Overstay Detection**: Background service flags vehicles parked beyond a time limit (e.g., 6 hours).
- **Operator Notifications**: Auto toast notifications when overstays are detected.
- **Overdue Tab**: Real-time list of all overstaying vehicles.
- **Detailed Overdue View**: Shows duration, overdue time, and other session details.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Frontend**: React + Tailwind CSS
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/), [Recharts](https://recharts.org/)
- **State Management**: [TanStack Query](https://tanstack.com/query) (React Query)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Database**: MongoDB
- **ODM**: Mongoose
- **API Layer**: Next.js API Routes

---

## 🚀 Local Setup and Installation

### 📦 Prerequisites

- **Node.js** v18+
- **npm** or **yarn**
- **MongoDB** (Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for cloud-based setup)

---

### 🔧 Steps to Run Locally

1. **Clone the Repository**

```bash
git clone https://github.com/krishkalaria12/motorq-parking-system.git
cd mall-parking-system
