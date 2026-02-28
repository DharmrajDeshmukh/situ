const GroupMember = require('../models/GroupMember');
const Group = require('../models/Group');

// --- HELPER: Verify Authority ---
// Only Owner/Co-Owner can manage permissions
const checkAuthority = async (groupId, reqUserId) => {
    const member = await GroupMember.findOne({ groupId, userId: reqUserId });
    if (!member || (member.role !== 'owner' && member.role !== 'co_owner')) {
        throw new Error('Not authorized. Only Owner or Co-owner can manage permissions.');
    }
    return member;
};

// 1. Promote to Admin
exports.promoteToAdmin = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        await checkAuthority(groupId, req.user.id);

        await GroupMember.findOneAndUpdate(
            { groupId, userId },
            { role: 'admin' }
        );
        res.json({ success: true, message: 'Promoted to admin' });
    } catch (e) { res.status(403).json({ success: false, message: e.message }); }
};

// 2. Demote Admin
exports.demoteAdmin = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        await checkAuthority(groupId, req.user.id);

        // Cannot demote owner
        const target = await GroupMember.findOne({ groupId, userId });
        if (target.role === 'owner') return res.status(400).json({message: "Cannot demote owner"});

        target.role = 'member';
        target.permissions = {}; // Reset permissions
        await target.save();
        
        res.json({ success: true, message: 'Demoted to member' });
    } catch (e) { res.status(403).json({ success: false, message: e.message }); }
};
// 3. Update Group Permissions
exports.updateGroupPermissions = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        await checkAuthority(groupId, req.user.id);

        const updates = {};
        const fields = ['canCreateProject', 'canCreatePost', 'canDeletePost', 'canInviteMembers', 'canRemoveMembers', 'canHireMembers'];
        
        fields.forEach(field => {
            if (req.body[field] !== undefined) updates[`permissions.${field}`] = req.body[field];
        });

        await GroupMember.findOneAndUpdate({ groupId, userId }, { $set: updates });
        res.json({ success: true, message: 'Permissions updated' });
    } catch (e) { res.status(403).json({ success: false, message: e.message }); }
};

// 4. Get My Group Permissions
exports.getMyGroupPermissions = async (req, res) => {
    try {
        const member = await GroupMember.findOne({ groupId: req.params.groupId, userId: req.user.id });
        if (!member) return res.status(404).json({ message: "Not a member" });

        res.json({
            role: member.role.toUpperCase(),
            permissions: member.permissions
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

// 5. Toggle Group Hiring
exports.toggleGroupHiring = async (req, res) => {
    try {
        const { groupId } = req.params;
        await checkAuthority(groupId, req.user.id); 

        const { isHiringOpen } = req.body;
        
        await Group.findByIdAndUpdate(groupId, {
            'hiring.isOpen': isHiringOpen,
            'hiring.updatedAt': new Date()
        });

        res.json({ success: true, message: `Hiring ${isHiringOpen ? 'opened' : 'closed'}` });
    } catch (e) { res.status(403).json({ success: false, message: e.message }); }
};