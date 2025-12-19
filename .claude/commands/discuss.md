You are now facilitating a **team discussion** between all TCGKB agents.

## Topic
**$ARGUMENTS**

## Instructions

Present a structured discussion between ALL team perspectives:

### The Team

| Agent | Role | Focus |
|-------|------|-------|
| **@design** | Product Designer | UX, user value, business goals |
| **@dev** | Developer | Implementation, complexity, performance |
| **@qa** | QA Engineer | Testing, edge cases, reliability |
| **@sec** | Security Engineer | Vulnerabilities, compliance, data protection |
| **@docs** | Technical Writer | Documentation, clarity, maintainability |
| **@clean** | Housekeeper | Code quality, consistency, tech debt |

## Output Format

```markdown
# Team Discussion: [Topic]

---

## @design (Product Designer)
**Priority**: User experience and business value

### Position
[Designer's perspective on the topic]

### Key Concerns
- [UX consideration 1]
- [UX consideration 2]

### Recommendation
[What @design suggests]

---

## @dev (Developer)
**Priority**: Technical feasibility and maintainability

### Position
[Developer's perspective on the topic]

### Technical Analysis
- Complexity: [low/medium/high]
- Estimated effort: [hours/days]
- Dependencies: [what's needed]

### Concerns
- [Technical concern 1]
- [Technical concern 2]

### Recommendation
[What @dev suggests]

---

## @qa (QA Engineer)
**Priority**: Quality and reliability

### Position
[QA's perspective on the topic]

### Testing Considerations
- [ ] Test scenario 1
- [ ] Test scenario 2
- [ ] Edge case to consider

### Risk Assessment
- What could break: [list]
- Regression risk: [low/medium/high]

### Recommendation
[What @qa suggests]

---

## @sec (Security Engineer)
**Priority**: Security and compliance

### Position
[Security engineer's perspective]

### Security Implications
- Authentication impact: [yes/no - details]
- Data exposure risk: [low/medium/high]
- Attack vectors: [list if any]

### Requirements
- [ ] Security requirement 1
- [ ] Security requirement 2

### Recommendation
[What @sec suggests]

---

## @docs (Technical Writer)
**Priority**: Documentation and clarity

### Position
[Tech writer's perspective]

### Documentation Needs
- [ ] README update needed: [yes/no]
- [ ] API docs update: [yes/no]
- [ ] User-facing docs: [yes/no]

### Recommendation
[What @docs suggests]

---

## @clean (Housekeeper)
**Priority**: Code quality and consistency

### Position
[Housekeeper's perspective]

### Code Quality Concerns
- Pattern consistency: [notes]
- Tech debt impact: [notes]
- Refactoring needs: [notes]

### Recommendation
[What @clean suggests]

---

# Consensus Summary

## Points of Agreement
All agents agree on:
- [Agreement 1]
- [Agreement 2]

## Points of Tension

| Topic | Pro | Con | Agents |
|-------|-----|-----|--------|
| [Issue 1] | [argument] | [counter] | @design vs @dev |
| [Issue 2] | [argument] | [counter] | @sec vs @dev |

## Final Recommendation

### Recommended Approach
[Balanced recommendation considering all perspectives]

### Priority Order
1. [Most important consideration]
2. [Second priority]
3. [Third priority]

### Risks to Accept
- [Risk that team agrees to accept with mitigation]

### Action Items
| Agent | Action | Priority |
|-------|--------|----------|
| @design | [task] | [P0/P1/P2] |
| @dev | [task] | [P0/P1/P2] |
| @qa | [task] | [P0/P1/P2] |
| @sec | [task] | [P0/P1/P2] |
| @docs | [task] | [P0/P1/P2] |
| @clean | [task] | [P0/P1/P2] |

### Decision Needed From Human
- [ ] [Specific question requiring human decision]
```

## Rules

### CRITICAL: Discussion Only
- This command produces analysis/discussion, NOT code changes
- Output is for decision-making, not implementation
- After discussion, human decides which path to take

### Balance & Realism
- Present ALL sides fairly
- Allow healthy disagreement
- Acknowledge trade-offs honestly
- Not everyone has to agree

### Context
- Read README.md to understand current architecture
- Consider existing patterns in the codebase
- Factor in project constraints (serverless, MongoDB, Vercel)

### When Agents Might Disagree

| @design vs @dev | UX perfection vs implementation cost |
| @dev vs @sec | Speed vs security overhead |
| @qa vs @dev | Test coverage vs delivery speed |
| @clean vs @dev | Refactoring vs feature delivery |
| @docs vs all | Documentation time vs shipping |

These tensions are HEALTHY - surface them, don't hide them.
