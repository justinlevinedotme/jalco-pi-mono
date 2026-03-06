// Test: verify the regex filtering + name matching works correctly.
//
// Simulates the exact flow:
//   1. getCommands() returns "skill:commit" etc.
//   2. bareSkillName strips the prefix → "commit"
//   3. disabledSkills stores unprefixed names
//   4. before_agent_start regex matches <name>commit</name> correctly

function bareSkillName(name) {
  return name.replace(/^skill:/, "");
}

const systemPrompt = `
Some intro text...
<available_skills>
  <skill>
    <name>commit</name>
    <description>Read this skill before making git commits</description>
    <location>/home/igorw/.pi/agent/git/github.com/mitsuhiko/agent-stuff/skills/commit/SKILL.md</location>
  </skill>
  <skill>
    <name>github</name>
    <description>Interact with GitHub using the gh CLI.</description>
    <location>/home/igorw/.pi/agent/git/github.com/mitsuhiko/agent-stuff/skills/github/SKILL.md</location>
  </skill>
  <skill>
    <name>mermaid</name>
    <description>Must read guide on creating/editing mermaid charts</description>
    <location>/home/igorw/.pi/agent/git/github.com/mitsuhiko/agent-stuff/skills/mermaid/SKILL.md</location>
  </skill>
</available_skills>
<available_workflows>
  <workflow>
    <name>deploy</name>
    <description>Deploy workflow</description>
    <location>/some/path</location>
  </workflow>
</available_workflows>
Some other text...
`;

// Simulate: getCommands() returned ["skill:commit", "skill:github", "skill:mermaid"]
// User disabled all, then re-enabled github.
const getCommandsResult = [
  { name: "skill:commit", source: "skill" },
  { name: "skill:github", source: "skill" },
  { name: "skill:mermaid", source: "skill" },
];

const allSkills = getCommandsResult
  .filter((c) => c.source === "skill")
  .map((c) => ({ name: bareSkillName(c.name) }));

console.log(
  "All skills (bare names):",
  allSkills.map((s) => s.name),
);

// Disable all, then re-enable github
const disabledSkills = new Set(allSkills.map((s) => s.name));
disabledSkills.delete("github");

console.log("Disabled:", [...disabledSkills]);
console.log("Expected disabled: commit, mermaid");
console.log();

// --- Run the filtering logic ---
let updatedPrompt = systemPrompt;
let filteredSkillsBlock = "";
const startTag = "<available_skills>";
const endTag = "</available_skills>";
const startIndex = updatedPrompt.indexOf(startTag);
const endIndex = updatedPrompt.indexOf(endTag);

if (startIndex !== -1 && endIndex !== -1) {
  let skillsBlock = updatedPrompt.substring(startIndex + startTag.length, endIndex);

  skillsBlock = skillsBlock.replace(/(\s*<skill>[\s\S]*?<\/skill>)/gi, (match) => {
    const nameMatch = match.match(/<name>(.*?)<\/name>/i);
    if (nameMatch?.[1]) {
      const name = nameMatch[1].trim();
      if (disabledSkills.has(name)) {
        console.log(`  REMOVING: ${name}`);
        return "";
      }
      console.log(`  KEEPING:  ${name}`);
    }
    return match;
  });

  filteredSkillsBlock = skillsBlock;
  updatedPrompt =
    updatedPrompt.substring(0, startIndex + startTag.length) +
    skillsBlock +
    updatedPrompt.substring(endIndex);
}

// --- Verify results ---
console.log();

// Check: github should be present
const hasGithub = updatedPrompt.includes("<name>github</name>");
// Check: commit and mermaid should be gone
const hasCommit = updatedPrompt.includes("<name>commit</name>");
const hasMermaid = updatedPrompt.includes("<name>mermaid</name>");
// Check: workflows are untouched
const hasDeploy = updatedPrompt.includes("<name>deploy</name>");
const hasWorkflowsBlock = updatedPrompt.includes("<available_workflows>");

console.log("PASS github present:", hasGithub ? "✅" : "❌ FAIL");
console.log("PASS commit removed:", !hasCommit ? "✅" : "❌ FAIL");
console.log("PASS mermaid removed:", !hasMermaid ? "✅" : "❌ FAIL");
console.log("PASS workflows untouched:", hasDeploy && hasWorkflowsBlock ? "✅" : "❌ FAIL");

// Verify notification only scans within available_skills
const remaining = [...filteredSkillsBlock.matchAll(/<name>(.*?)<\/name>/gi)].map((m) => m[1]);
console.log(
  "PASS notification shows only skills:",
  remaining.join(", ") === "github" ? "✅" : `❌ FAIL (got: ${remaining.join(", ")})`,
);

// Test input interceptor
const inputText = "/skill:commit some args";
const interceptedName = inputText.slice(7).split(/\s/)[0];
console.log(
  "PASS input intercept extracts correct name:",
  interceptedName === "commit" ? "✅" : `❌ FAIL (got: ${interceptedName})`,
);
console.log(
  "PASS input intercept blocks disabled skill:",
  disabledSkills.has(interceptedName) ? "✅" : "❌ FAIL",
);

const inputText2 = "/skill:github";
const interceptedName2 = inputText2.slice(7).split(/\s/)[0];
console.log(
  "PASS input intercept allows enabled skill:",
  !disabledSkills.has(interceptedName2) ? "✅" : "❌ FAIL",
);

console.log("\n--- Final prompt ---");
console.log(updatedPrompt);
