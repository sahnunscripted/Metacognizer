import RecurringAction from '../models/RecurringAction.js';
import Action from '../models/Action.js';

export default async function generateRecurringActions(userId) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayDayOfWeek = now.getDay();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const templates = await RecurringAction.find({
    userId,
    status: 'active',
    daysOfWeek: todayDayOfWeek,
    lastGeneratedDate: { $ne: todayStr },
    endDate: { $gte: startOfToday }
  });

  const created = [];

  for (const template of templates) {
    const existing = await Action.findOne({
      recurringActionId: template._id,
      userId,
      deadline: { $gte: startOfToday, $lt: new Date(startOfToday.getTime() + 86400000) }
    });

    if (existing) {
      template.lastGeneratedDate = todayStr;
      await template.save();
      continue;
    }

    const action = new Action({
      title: template.title,
      description: template.description,
      context: template.context,
      project: template.project,
      estimatedMinutes: template.estimatedMinutes,
      priority: template.priority,
      deadline: endOfToday,
      status: 'active',
      recurringActionId: template._id,
      userId
    });

    // Auto-extract keywords
    const text = `${template.title} ${template.description || ''}`;
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    action.keywords = [...new Set(words)].slice(0, 10);

    const savedAction = await action.save();
    created.push(savedAction);

    template.lastGeneratedDate = todayStr;
    await template.save();
  }

  // Auto-expire templates whose endDate has passed
  await RecurringAction.updateMany(
    { userId, status: 'active', endDate: { $lt: startOfToday } },
    { $set: { status: 'expired' } }
  );

  return created;
}
