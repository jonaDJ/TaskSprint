# TaskSprint

TaskSprint is a private, local-first weekly planner for scheduling focused work in 30-minute blocks. It combines a spreadsheet-style calendar with recurring tasks, completion tracking, overlap protection, and direct manipulation through dragging and resizing.

## Current features

- Monday-to-Sunday weekly calendar
- Schedule from 4:00 AM through midnight
- Compact 30-minute time slots
- Create and edit color-coded tasks
- Daily, weekday, and weekly repetition with an end date
- Edit one occurrence or the selected occurrence and future tasks
- Delete one occurrence or the selected occurrence and future tasks
- Confirmation before destructive deletion
- Completion checkboxes and automatic missed-task detection
- Live current-time line and active-task highlighting
- Overlap detection for normal and repeating tasks
- Drag-and-drop rescheduling with 30-minute snapping
- Direct task resizing with conflict protection
- Responsive desktop and mobile layouts
- Browser-based persistence without an account

## Technology

- Next.js 16
- React 19
- TypeScript
- Plain CSS
- Browser `localStorage`

No backend, authentication service, or cloud database is required for the current calendar version.

## Getting started

Requirements:

- Node.js 20 or newer
- npm

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If that port is already occupied, Next.js will display the alternative local URL in the terminal.

Create a production build:

```bash
npm run build
```

Run the production server:

```bash
npm start
```

## How to use the calendar

- Select an empty cell to create a task.
- Choose start and end times in 30-minute increments.
- Select a category to control the task cell color.
- Check a task to mark it complete.
- Drag a task to reschedule it while preserving its duration.
- Drag the handle at the bottom of a task to resize it.
- Select a task to edit or delete it.
- For repeating tasks, choose whether an edit applies once or to future occurrences.

The calendar prevents overlapping tasks. If a requested time is occupied, the editor stays open and identifies the conflicting task.

## Data storage

Task data is stored locally in the browser under:

```text
tasksprint.tasks.v2
```

The data remains after refreshing the page or restarting the development server, but it is specific to the current browser and domain. Clearing browser site data removes the schedule. Data is not currently synchronized across devices.

You can inspect the stored data in browser developer tools under **Application → Local Storage**.

## Project structure

```text
app/
  globals.css                 Application and calendar styles
  layout.tsx                  Root page layout and metadata
  page.tsx                    Calendar page
components/
  icons.tsx                   Interface icons
  task-dialog.tsx             Create and edit task interface
  weekly-calendar.tsx         Calendar behavior and interactions
lib/
  calendar.ts                 Task types, recurrence, dates, and time helpers
```

## Current limitations

- Data is stored on one browser only.
- There is no cloud synchronization or automatic backup.
- Browser reminders and notifications are not implemented yet.
- Dragging is primarily optimized for desktop pointer interaction.
- Sprint goals, projects, and progress reports are planned but not yet implemented.

## Planned direction

1. Missed-task actions such as reschedule, skip, delay, and complete now
2. Daily focus view
3. Sprint goals and weekly progress
4. Projects and milestones
5. Export, import, and cloud synchronization
