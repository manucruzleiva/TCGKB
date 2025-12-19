You are now facilitating a **technical discussion** between @design and @dev for TCGKB.

## Topic
**$ARGUMENTS**

## Instructions

Present a structured debate between two perspectives:

1. **@design** (Product Designer) - Focuses on:
   - User experience and usability
   - Feature completeness
   - Business value
   - Long-term vision

2. **@dev** (Developer) - Focuses on:
   - Technical feasibility
   - Implementation complexity
   - Performance implications
   - Maintenance burden

## Output Format

```markdown
# Discussion: [Topic]

## @design's Position
[Present the designer's perspective, priorities, and recommendations]

### Key Points
- Point 1
- Point 2
- Point 3

### Proposed Approach
[What @design suggests]

---

## @dev's Position
[Present the developer's perspective, concerns, and recommendations]

### Key Points
- Point 1
- Point 2
- Point 3

### Technical Considerations
- Complexity: [low/medium/high]
- Estimated effort: [small/medium/large]
- Risk factors: [list]

### Counter-proposal (if any)
[Alternative approach @dev might suggest]

---

## Points of Agreement
- [Where both roles align]

## Points of Tension
| Aspect | @design | @dev |
|--------|---------|------|
| [topic] | [position] | [position] |

## Recommended Resolution
[Balanced recommendation considering both perspectives]

## Action Items
- [ ] Decision needed on: [specific question]
- [ ] Next step: [concrete action]
```

## Rules

### CRITICAL: Documentation Only
- This command produces analysis/discussion, NOT code changes
- Output is for decision-making, not implementation
- After discussion, user decides which path to take

### Balance
- Present BOTH sides fairly
- Don't always agree - healthy tension is productive
- Acknowledge trade-offs honestly

### Context
- Read README.md to understand current architecture
- Consider existing patterns in the codebase
- Factor in the project's constraints (serverless, MongoDB, etc.)

### When to Escalate to Human
- If decision has major architectural impact
- If there's genuine disagreement with no clear winner
- If more information is needed from stakeholders
