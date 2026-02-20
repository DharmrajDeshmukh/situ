
const Skill = require("../models/Skill");

exports.getAllSkills = async (req, res) => {
  try {
    const skills = await Skill
      .find({})
      .select("_id name")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      skills: skills.map(s => ({
        id: s._id,
        name: s.name
      }))
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load skills"
    });
  }
};
