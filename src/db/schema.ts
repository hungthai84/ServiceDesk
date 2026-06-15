import { integer, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  name: text('name').notNull(),
  email: text('email').notNull(),
  role: text('role').default('member'),
  avatar: text('avatar'),
  phoneNumber: text('phone_number'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  taskListId: text('task_list_id'),
  title: text('title').notNull(),
  description: text('description'),
  completed: boolean('completed').default(false),
  status: text('status').default('Cần làm'),
  priority: text('priority').default('Trung bình'),
  recurring: text('recurring').default('none'),
  dueDate: text('due_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  ownerId: text('owner_id'),
  assigneeId: text('assignee_id'),
  assigneeName: text('assignee_name'),
  assigneeAvatar: text('assignee_avatar'),
  order: integer('order').default(0),
});

export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.uid],
  }),
}));
