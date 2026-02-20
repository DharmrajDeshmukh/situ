const mongoose = require("mongoose");
require("dotenv").config();

const Group = require("../models/Group");
const GroupMember = require("../models/GroupMember");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    const groups = await Group.find();
    console.log(`🔎 Found ${groups.length} groups`);

    for (const group of groups) {

      // members → GroupMember
      for (const userId of group.members || []) {
        await GroupMember.updateOne(
          { groupId: group._id, userId },
          { groupId: group._id, userId, role: "member" },
          { upsert: true }
        );
      }

      // admins → GroupMember
      for (const userId of group.admins || []) {
        await GroupMember.updateOne(
          { groupId: group._id, userId },
          { groupId: group._id, userId, role: "admin" },
          { upsert: true }
        );
      }
    }

    console.log("🎉 Migration completed successfully");
    process.exit(0);

  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
})();
