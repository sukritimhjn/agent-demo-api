# Who verifies the agent?

### The missing trust layer in agent-driven development — a hands-on teardown of GitKraken's MCP server

**Sukriti Mahajan** · June 2026
Repos: github.com/sukritimhjn/agent-demo-api · github.com/sukritimhjn/agent-demo-web

---

**In one line:** When an AI agent writes the code, the hard part of developer experience stops being *execution* and becomes *verification and coordination* — and that is exactly the surface an agentic DevEx platform is positioned to own.

---

## What I built and did

I stood up two repos — a small Node API and a web client — with six issues assigned to me across both (three per repo, including one that deliberately spanned both). I wired GitKraken's MCP server into Claude Code and drove a real "assigned ticket → branch → change → PR" flow through the agent, then verified every result against what correct behavior actually looks like rather than trusting that the agent reported success.

This wasn't a demo I watched. I ran it, broke it, and checked it.

## What I expected versus what I found

I went in expecting to keep a friction log of everything that broke *in GitKraken*. I found almost none — and that absence turned out to be the most useful result of the exercise. GitKraken did its job quietly and well. The friction was real, but it lived somewhere else: around the agent, not in the tool that orchestrates it.

## The division of labor

Using the MCP server in a live agent loop makes the boundary obvious:

| Layer | Owns | What I observed |
|---|---|---|
| GitKraken MCP | Surfacing + orchestration | Told the agent what was assigned to me, handed it git and issue tools, coordinated work across two repos, and gave a place to monitor multi-repo activity. It did this cleanly. |
| Claude Code (the agent) | Execution | Wrote the code, made the branches and commits, opened the PRs, and resolved conflicts. This is where the actual work — and the actual risk — lived. |

That split is why I hit no friction in GitKraken: it is the connective tissue, and the connective tissue held. The interesting problems are one layer over, in what the agent produced and whether I could trust it.

## Where the friction actually was

**1. Verification — the trust gap.** The sharpest moment of the whole exercise was a false alarm. Testing the new `POST /users` endpoint, I got a `400` on what should have been a valid request and nearly logged it as a defect the agent had shipped as "done." It wasn't. Reading the handler source showed the agent had parsed the request body correctly; the `400` came from my own test harness — PowerShell was silently mangling the JSON before it ever reached the server. The lesson cuts both ways: a surface signal looked like a finding and wasn't, and only *behavioral verification plus ruling out my own tooling* revealed the truth. In an agent-driven world, "it ran and reported success" is not evidence that the outcome is correct — in either direction.

**2. Multi-repo coherence under iteration.** Resolving six issues iteratively across two repos produced the expected coordination cost — keeping changes consistent when work spans repositories and builds on itself. GitKraken's role here is to make that coordination *visible and manageable*; the difficulty itself is inherent to the workflow, not the tool.

**3. First-run and testing edges — the activation surface.** The place a real developer actually stalls is setup and verification, and I hit a series of these: the auth flow breaking silently in the default Windows Git Bash/MinTTY terminal (needing an undocumented `winpty` workaround), a Pro-plan gate, an integration that must sit on the same account as the CLI or the agent sees nothing, a page that loaded empty until a CORS header was added, and a testing tool (`curl`) quietly aliased and its input reshaped by the shell. None of these are GitKraken bugs. All of them are exactly the kind of papercut that determines whether a developer reaches "it works" or gives up — which makes them a product concern for whoever owns the workflow.

## The argument

Agents have collapsed the cost of writing code. What they have not collapsed — and have arguably made scarcer — are two things I felt directly in this exercise: **knowing whether to trust a completed change**, and **keeping many agent-driven changes coherent across repos and people**. A platform that already surfaces work items and monitors multi-repo activity is the natural place for a trust layer to live. The value in an agentic DevEx product is migrating from helping a human write code faster to helping a human *supervise agents they can't fully verify by hand*.

## Mini-spec: an agent-output trust surface

- **Problem.** When an agent marks a work item done, the developer has no fast, trustworthy signal that the change is actually correct. "Done" and "correct" are different claims, and today only the first is visible.
- **Proposal.** Next to each agent-completed work item, surface an acceptance signal: *agent reports done* shown alongside *acceptance checks pass / fail*. The checks are the ticket's own success criteria, run automatically against the change.
- **Why here, why now.** GitKraken already owns the work-item surface and the multi-repo view. As more code is written by agents, the differentiated value is not another way to generate a diff — it's a trustworthy answer to "did this actually do what the ticket asked?"
- **Rough scope.** Start narrow: let a work item carry a small set of executable acceptance checks; run them post-change; render pass/fail beside the item. Expand to multi-repo work items where a change must satisfy criteria in more than one repo.
- **Success metric.** Percentage of agent-completed items a developer accepts *without manual re-verification* — and, inversely, how often the check catches a "done but not correct" change before a human would have.
- **Open question.** Where do acceptance checks come from — authored by the developer when filing the item, inferred from the ticket, or proposed by the agent and confirmed by a human? That authorship question is the real design problem.

## How I evaluated

I scored each of the four resolved endpoints against defined correct behavior, not against the agent's success report: the pagination fix returns items 1–10 on page 1 (correct), the new `/health` route works end to end across both repos including a visible status indicator (correct), CORS is set so the client can actually read the response (correct), and `POST /users` both rejects an empty email and — once I fixed my own test harness — accepts a valid one (correct). Four clean results, and, more importantly, one false positive I caught by verifying behavior and source instead of trusting a surface signal.

This is the same lesson from my earlier reinforcement-learning work: in a DPO/RLHF fine-tune, a configuration that produced a better reward margin (β = 0.5) produced *worse* real-world behavior — more hallucination. Strong training metrics, degraded behavior. The discipline that catches that gap is the discipline that caught the false positive here: measure behavior, not the proxy.

## What I'd build next

A small verification harness that operationalizes the mini-spec: a golden set of acceptance checks that run against an agent's PR and report pass/fail next to the work item, with the failure modes made observable. It's a natural extension of the eval work I already do, and it turns the argument above into something you can actually put in front of a developer.

## Appendix — method

Environment: Windows 11, Git Bash (MinTTY) and PowerShell, Node v24, GitKraken CLI + MCP server on a Pro trial, GitHub integration, Claude Code as the agent. Two repos, six issues, one agent-driven ticket-to-PR flow per issue, each result verified by hand.
