exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(200).json([]);
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } }
      ]
    })
      .select("_id name username profilePic")
      .limit(10);

    res.status(200).json(
      users.map(u => ({
        userId: u._id.toString(),
        name: u.name,
        username: u.username,
        profilePic: u.profilePic
      }))
    );
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
