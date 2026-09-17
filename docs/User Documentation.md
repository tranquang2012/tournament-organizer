# Tournament Organizer System — User Guide

## Table of Contents

1. [System Overview](#1-system-overview)
   - [1.1. User Roles](#11-user-roles)
2. [Guest Guide (Not Logged In)](#2-guest-guide-not-logged-in)
3. [User Guide](#3-user-guide)
   - [3.1. Sign Up / Log In](#31-sign-up--log-in)
   - [3.2. Viewing Tournaments](#32-viewing-tournaments)
   - [3.3. Favoriting a Tournament and Email Notifications](#33-favoriting-a-tournament-and-email-notifications)
4. [Admin Guide](#4-admin-guide)
   - [4.1. Tournament Creation Workflow](#41-tournament-creation-workflow)
   - [4.2. Configuring and Managing Matches](#42-configuring-and-managing-matches)
   - [4.3. AI Assistant for Tournament Setup](#43-ai-assistant-for-tournament-setup)
   - [4.4. Scope of Admin Access](#44-scope-of-admin-access)
5. [Super Admin Guide](#5-super-admin-guide)
   - [5.1. Viewing All Tournaments](#51-viewing-all-tournaments)
   - [5.2. Managing Admin Permissions](#52-managing-admin-permissions)
6. [Frequently Asked Questions (FAQ)](#6-frequently-asked-questions-faq)

---

## 1. System Overview

Tournament Organizer is a centralized system for managing and running sports tournaments. It supports creating tournaments, managing players/teams, scheduling matches, updating live scores, and tracking results from the group stage through to the knockout bracket.

The system supports both team-based and individual tournaments, along with an integrated AI assistant (chatbot) that helps administrators set up tournaments quickly and correctly.

### 1.1. User Roles

| Role | Permissions |
| --- | --- |
| **Guest** | Not logged in. Can only view the tournament list and details in the public User view. |
| **User** | Logged in. Can view tournaments and mark them as Favorite to receive email notifications. Cannot self-register to compete — players/teams are entered by an Admin/Super Admin. |
| **Admin** | Creates and manages the tournaments they created: enters tournament info, players, format, generates matches, and updates scores. Can only see their own tournaments. |
| **Super Admin** | Has all Admin permissions, plus can view every tournament in the system and can promote or demote other users' Admin role. |

> **Note:** Players/teams competing in a tournament are always entered by an Admin or Super Admin — regular Users cannot self-register to compete.

---

## 2. Guest Guide (Not Logged In)

Guests can access the system without an account, with limited viewing permissions:

- View the list of ongoing, upcoming, and completed tournaments.
- View tournament details: format, match schedule, bracket/group standings, and live scores.
- View the match schedule in Calendar view.
- Cannot favorite tournaments or receive email notifications — logging in is required for this feature.

---

## 3. User Guide

### 3.1. Sign Up / Log In

1. Go to the login page and select **Sign Up** if you don't have an account yet.
2. Fill in your details, or log in quickly using a supported OAuth provider (e.g. Google).
3. After logging in, you can update your avatar from your profile page.

### 3.2. Viewing Tournaments

Users have the same viewing permissions as Guests: tournament list, tournament details, match schedule, bracket, and live scores.

### 3.3. Favoriting a Tournament and Email Notifications

This feature is available only to logged-in Users:

- Go to the tournament list or a tournament's detail page.
- Click the **Favorite** icon on the tournament you want to follow.
- Favorited tournaments are saved to your account so you can easily find them again.
- When a favorited tournament is about to start, the system automatically sends an email notification to your registered email address.

> **Note:** You can unfavorite a tournament at any time by clicking the Favorite icon again; you will then stop receiving email notifications for that tournament.

---

## 4. Admin Guide

Admins create and run tournaments. The main steps for organizing a tournament are as follows:

### 4.1. Tournament Creation Workflow

1. Enter the tournament's basic information: name, description, date/time, and location.
2. Choose the sport for the tournament.
3. Choose the competition type: Team or Individual.
4. Add the list of players/teams participating in the tournament.
5. Choose the tournament format (e.g. group stage, knockout, or a combination of both).
6. Click **Publish** to make the tournament public — once published, it becomes visible to Users and Guests.

### 4.2. Configuring and Managing Matches

- After publishing a tournament, the Admin goes to the **Config Match** page, where the system automatically generates the list of matches based on the chosen format and the list of players/teams.
- The system automatically schedules the matches.
- The Admin enters the score for each match once it has finished.
- Based on the scores entered, the system automatically handles: group-stage standings, determining which team/player advances to the bracket, and determining the champion once the tournament ends.
- The Admin can review and adjust the match schedule on the **Calendar** page.

> **Note:** The Admin does not need to manually calculate standings or determine who advances — the system handles all of this logic automatically once scores are entered.

### 4.3. AI Assistant for Tournament Setup

- The Admin interface includes an AI chatbot that helps guide the tournament setup process.
- Admins can chat directly with the chatbot for step-by-step guidance: entering tournament info, choosing a sport, choosing a format, adding players, and so on.
- The chatbot acts as a guide — it answers questions and points to the right actions, but it does not create the tournament on the Admin's behalf.
- This is especially useful for new Admins, helping to reduce setup mistakes the first time around.

### 4.4. Scope of Admin Access

Admins can only view and manage the tournaments they created themselves. Viewing every tournament in the system requires Super Admin access.

---

## 5. Super Admin Guide

Super Admins have all Admin capabilities ([Section 4](#4-admin-guide)), plus the following additional administrative permissions:

### 5.1. Viewing All Tournaments

Unlike Admins (who only see their own tournaments), Super Admins can see every tournament created by every Admin in the system.

### 5.2. Managing Admin Permissions

1. Go to the user management page.
2. Select a User account to promote to Admin, or select an Admin to demote back to a regular User.
3. The permission change takes effect immediately after confirmation.

> **Note:** Only a Super Admin can promote or demote an Admin. Consider carefully before demoting an Admin who is currently managing an active tournament.

---

## 6. Frequently Asked Questions (FAQ)

**Q: I'm not receiving email notifications for a tournament I favorited. Why?**  
**A:** Check that the tournament is still marked as Favorite on your account, and check your email's Spam/Junk folder.

**Q: As an Admin, I can't see tournaments created by other Admins — is this a bug?**  
**A:** No, this is by design. Admins can only see the tournaments they created themselves. Only a Super Admin can view every tournament in the system.

**Q: Does the AI chatbot create the tournament for me automatically?**  
**A:** No. The chatbot only guides you through the setup process — the Admin still enters the information and performs the actions in the system directly.

**Q: Can players register themselves to compete in a tournament?**  
**A:** No. The list of players/teams for each tournament is entered directly by an Admin or Super Admin when the tournament is created.
