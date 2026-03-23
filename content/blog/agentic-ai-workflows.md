---
slug: "agentic-ai-workflows"
title: "Agentic AI in Production: Architecture, Orchestration, and Governance"
excerpt: "Agentic AI systems that loop, call tools, and manage state are in production at scale. Here's how the orchestration frameworks compare and what governance actually requires."
date: "2026-01-05"
tags: ["AI/ML", "Platform Engineering"]
author: "Ade A."
imageUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=600&fit=crop"
imageAlt: "Abstract circuit board visualization representing AI agent orchestration and multi-step workflow execution"
---

# Agentic AI in Production: Architecture, Orchestration, and Governance

The gap between an LLM that answers questions and a system that completes work is a control loop. An agent perceives state, decides what to do, executes an action — a tool call, an API request, a subprocess — and feeds the result back into the next decision. That loop is the structural difference between a chatbot and an agent, and it's what makes agentic systems both more powerful and significantly harder to operate.

The orchestration layer that manages these loops is where most production implementations break down. Picking the right framework, understanding what makes multi-agent coordination reliable, and building the observability to know when something goes wrong are the practical problems this post covers.

> **What you'll take away:**
> - The ReAct loop (Reason → Act → Observe) is the dominant single-agent pattern — most frameworks are implementations of it with different graph primitives
> - LangGraph, AutoGen, and CrewAI target different orchestration problems — the choice matters more than most teams realise before they've debugged a production incident
> - Model Context Protocol (MCP) and Agent2Agent (A2A) are the interoperability layers that let agents consume tools and delegate to other agents without custom integration code
> - Governance is not a feature you add after deployment — token budget overruns, tool call loops, and credential blast radius need to be designed for from the start
> - OpenTelemetry's GenAI semantic conventions give you span-level trace visibility into agent reasoning chains ([OTel GenAI spec](https://opentelemetry.io/docs/specs/semconv/gen-ai/))

---

## What "Agentic" Actually Means Architecturally

The word is overloaded. In the context of production systems, an agent is a process that:

1. Receives a goal or trigger (not just a prompt)
2. Has access to tools — functions it can call to take real actions
3. Runs a decision loop that persists across multiple LLM calls
4. Maintains state between iterations (memory, intermediate results, progress tracking)

The simplest mental model is ReAct — Reasoning and Acting ([Yao et al., 2022, arXiv:2210.03629](https://arxiv.org/abs/2210.03629)). The agent generates a `Thought` (reasoning step), issues an `Action` (tool call), receives an `Observation` (tool result), and repeats until it produces a final answer. Most current frameworks are variations of this loop with different graph primitives on top.

What this loop enables that a single LLM call cannot: tool use across multiple steps where earlier results inform later decisions, state accumulation across context window boundaries, and handling of cases where the agent doesn't know in advance how many steps a task requires.

What it introduces that a single call doesn't: non-determinism in loop depth, tool execution failures that cascade, and cost curves that are hard to predict without token budget enforcement.

---

## Orchestration Framework Comparison

Three frameworks dominate production deployments as of early 2026. They're not interchangeable — they target different architectural problems.

### LangGraph — Graph-Based State Machines

LangGraph ([LangChain AI, 2024](https://langchain-ai.github.io/langgraph/)) represents agent workflows as directed graphs where nodes are Python functions and edges are conditional transitions. The agent's state is a typed dictionary that flows through the graph. Human-in-the-loop checkpoints, persistent state across sessions, and subgraph composition are first-class features.

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, List

class AgentState(TypedDict):
    messages: List[dict]
    tool_results: List[str]
    iteration_count: int

def should_continue(state: AgentState) -> str:
    # Hard limit on loop depth — critical for production
    if state["iteration_count"] >= 10:
        return END
    last_message = state["messages"][-1]
    if last_message.get("tool_calls"):
        return "tools"
    return END

def call_model(state: AgentState) -> AgentState:
    # LLM call with current state
    response = llm.invoke(state["messages"])
    return {
        "messages": state["messages"] + [response],
        "iteration_count": state["iteration_count"] + 1
    }

graph = StateGraph(AgentState)
graph.add_node("agent", call_model)
graph.add_node("tools", tool_executor)
graph.add_conditional_edges("agent", should_continue)
graph.add_edge("tools", "agent")
graph.set_entry_point("agent")

agent = graph.compile()
```

<!-- [UNIQUE INSIGHT] -->
The `iteration_count` guard is not optional in production. LangGraph's graph structure makes infinite loops visually obvious, but without a hard ceiling the agent will loop until your token budget or wallet runs out. I set this limit at the graph level — not inside any individual node — so it can't be bypassed by any code path.

LangGraph is the right choice when your workflow has branching logic, requires human approval steps, or needs persistent state across session boundaries. The graph structure makes complex workflows auditable — you can trace which node executed and what state it received.

### AutoGen — Conversational Multi-Agent

AutoGen ([Microsoft Research, 2023](https://microsoft.github.io/autogen/)) models multi-agent collaboration as a conversation. Agents are defined with roles and system prompts. They pass messages to each other through a group chat orchestrator that decides who speaks next.

```python
import autogen

config_list = [{"model": "gpt-4o", "api_key": os.environ["OPENAI_API_KEY"]}]
llm_config = {"config_list": config_list, "timeout": 60}

# Define specialized agents
planner = autogen.AssistantAgent(
    name="Planner",
    llm_config=llm_config,
    system_message=(
        "You break down complex engineering tasks into discrete steps. "
        "Output a numbered plan before any execution."
    ),
)

executor = autogen.AssistantAgent(
    name="Executor",
    llm_config=llm_config,
    system_message=(
        "You execute specific steps and report results precisely. "
        "Do not proceed to the next step until the current one succeeds."
    ),
)

critic = autogen.AssistantAgent(
    name="Critic",
    llm_config=llm_config,
    system_message=(
        "You review proposed actions for correctness and flag risks. "
        "Respond with APPROVE or REJECT with a specific reason."
    ),
)

user_proxy = autogen.UserProxyAgent(
    name="UserProxy",
    human_input_mode="NEVER",   # fully automated
    max_consecutive_auto_reply=15,
    code_execution_config={"work_dir": "/tmp/autogen", "use_docker": True},
)

groupchat = autogen.GroupChat(
    agents=[user_proxy, planner, executor, critic],
    messages=[],
    max_round=30,
)
manager = autogen.GroupChatManager(groupchat=groupchat, llm_config=llm_config)

user_proxy.initiate_chat(manager, message="Analyse the nginx access logs in /var/log/nginx/ and identify the top 5 client IPs by error rate.")
```

AutoGen works well for workflows where the value comes from agents critiquing each other's outputs — code review, analysis validation, adversarial testing. The conversational structure is intuitive but harder to constrain than a graph: you can't statically verify termination conditions the way you can in LangGraph.

### CrewAI — Role-Based Task Delegation

CrewAI ([CrewAI, 2024](https://docs.crewai.com/)) organises agents as a crew with explicit roles, goals, and backstories. Task assignments are declarative. Crew roles perform tasks sequentially or in parallel based on the `Process` type.

```python
from crewai import Agent, Task, Crew, Process

researcher = Agent(
    role="Infrastructure Researcher",
    goal="Find and summarise current Kubernetes autoscaling benchmarks",
    backstory="Senior platform engineer with deep Kubernetes expertise",
    verbose=False,
    allow_delegation=False,
    tools=[web_search_tool, arxiv_tool],
)

writer = Agent(
    role="Technical Writer",
    goal="Write a precise technical summary from research findings",
    backstory="Engineer who writes for other engineers — no filler words",
    verbose=False,
    allow_delegation=False,
)

research_task = Task(
    description="Find peer-reviewed or vendor benchmark data on HPA vs KEDA scaling latency published in 2024-2026.",
    expected_output="3-5 data points with citations, formatted as a numbered list.",
    agent=researcher,
)

write_task = Task(
    description="Write a 200-word summary of the research findings for a technical blog post.",
    expected_output="A precise 200-word paragraph. No filler. Cite each data point inline.",
    agent=writer,
    context=[research_task],
)

crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task],
    process=Process.sequential,
    verbose=False,
)

result = crew.kickoff()
```

CrewAI is the quickest path to a working multi-agent pipeline when the workflow is a linear sequence of specialised steps. The declarative task definition makes it readable, but the framework gives you less granular control over state and branching compared to LangGraph.

| Dimension | LangGraph | AutoGen | CrewAI |
|-----------|-----------|---------|--------|
| Workflow structure | Directed graph | Conversation | Sequential/parallel tasks |
| Debugging visibility | High (node-by-node trace) | Medium (conversation log) | Medium (task output) |
| Human-in-the-loop | First class | Configurable | Limited |
| Scale-to-complex-workflows | High | Medium | Low-Medium |
| Time-to-first-agent | Moderate | Fast | Fast |

---

## Interoperability: MCP and A2A

Two protocols have become the connective tissue between agents and between agents and tools.

**Model Context Protocol (MCP)** ([Anthropic, 2024](https://modelcontextprotocol.io/)) is the standard for how agents connect to tools and data sources. An MCP server exposes resources (data) and tools (functions) over a defined interface. An agent connects to one or more MCP servers without knowing their implementation. The practical result: the same agent can call a local filesystem tool, a Confluence search tool, a GitHub API tool, and a Kubernetes cluster tool through the same interface, without custom integration code for each.

<!-- [UNIQUE INSIGHT] -->
MCP is to agents what LSP (Language Server Protocol) is to editors. Before LSP, every editor needed a custom plugin for every language. MCP solves the same M×N problem for agents and tools. Most developer tooling is moving to expose MCP servers — which means agents built today will be able to consume new tools as they appear without changes to the agent itself.

**Agent2Agent Protocol (A2A)** ([Google and Salesforce, 2025](https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/)) handles agent-to-agent delegation. An agent exposes an A2A endpoint with an agent card describing its capabilities. A calling agent discovers it, delegates a task, and receives a result — without knowing which framework the downstream agent uses. A2A enables cross-platform multi-agent systems where a LangGraph orchestrator can delegate to a CrewAI specialist without any custom integration layer.

Neither protocol requires any specific framework. Both are transport-layer specifications that sit below your orchestration choice.

---

## Governance: What Actually Goes Wrong in Production

The technical gap most teams hit is not capability — it's the operational model. Three failure patterns appear consistently.

**Unbounded token consumption.** Agents that loop when stuck rather than failing gracefully. A ReAct loop with no depth limit will retry indefinitely, burning tokens at a rate that produces real cost spikes within minutes on high-concurrency deployments. Enforce loop depth at the orchestration layer, not inside agent logic — individual nodes can't be trusted to self-terminate.

**Credential blast radius.** Agents that use the credentials of the service account deploying them rather than scoped credentials for each tool. An agent that can write to production Elasticsearch, call an external API, and modify Kubernetes resources under a single service account is a misconfiguration waiting to cause an incident. Scope credentials per tool, use short-lived tokens where possible, and audit which tools each agent role actually needs. The IRSA pattern from KEDA (see [Kubernetes Autoscaling: HPA vs KEDA](/blog/kubernetes-autoscaling-hpa-vs-keda)) applies directly here for cloud-based agent deployments.

**Silent failure in multi-agent chains.** When agent A delegates to agent B and B returns an empty or error result, agent A often continues with the gap rather than failing. The downstream output looks plausible but is wrong. Structured output schemas with validation at each handoff catch this — an agent returning a result that doesn't match the expected schema should cause a hard failure, not a silent continuation.

### Observability for Agent Systems

Standard metrics (latency, error rate) are insufficient for agents. You need span-level visibility into individual tool calls and LLM reasoning steps.

OpenTelemetry's GenAI semantic conventions define a standard schema for agent telemetry ([OTel GenAI spec](https://opentelemetry.io/docs/specs/semconv/gen-ai/)). Key attributes worth capturing:

- `gen_ai.operation.name` — `chat`, `embeddings`, `tool_call`
- `gen_ai.usage.input_tokens` / `gen_ai.usage.output_tokens` — per-call token spend
- `gen_ai.tool.name` — which MCP tool was called
- `gen_ai.request.model` — which model was invoked

With EDOT Python (which added GenAI tracing in 9.1, see [Observability with EDOT](/blog/observability-with-elasticsearch-edot)), you get this instrumentation automatically for supported providers — no custom span creation required. The trace view in Kibana APM shows each LLM call as a span within the agent's distributed trace.

```python
# EDOT Python instruments openai, anthropic, and bedrock calls automatically
# Set the OTEL_EXPORTER_OTLP_ENDPOINT env var to your EDOT Collector or mOTLP endpoint
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

provider = TracerProvider()
provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
# After this, all LLM API calls within this process produce GenAI spans automatically
```

For teams already sending infrastructure and application telemetry to Elasticsearch, agent traces land in the same `traces-*` indices. Correlating an SLO breach with the agent reasoning that caused it becomes a single Kibana query.

---

## Your Existing Automation Is a Feature, Not Friction

RPA workflows and deterministic pipelines you already have are not threatened by agents — they become the reliable execution substrate that agents delegate to. An agent that needs to trigger a data pipeline, call an existing API, or submit a form should call those systems through their existing interfaces, not reimplement the logic.

The architecture that works in practice: agents handle judgment calls (classify this event, choose between these options, summarise this context), while deterministic automation handles execution (call this API, write this record, trigger this job). Agents that try to replace deterministic automation with LLM-based execution introduce non-determinism where you don't want it.

For teams running Elastic Workflows, the `ai.agent` step type makes this composition explicit — the deterministic workflow orchestrates execution, the agent handles reasoning, and the two never swap roles. See [Elasticsearch AI: Vector Search, RAG, and Agent Builder](/blog/elasticsearch-ai-platform) for the workflow YAML pattern.

---

## Frequently Asked Questions

**What is the difference between LangChain and LangGraph?**

LangChain is a library for chaining LLM calls and tool integrations. LangGraph is a separate framework built by the same team that models agent workflows as stateful directed graphs. For simple sequential chains, LangChain is sufficient. For anything that loops, branches, or requires persistent state, LangGraph is the right abstraction. Most production agentic systems have moved to LangGraph because the graph structure makes complex control flow debuggable.

**How do I prevent an agent from looping indefinitely?**

Enforce a hard loop limit at the graph or orchestration level — not inside any individual node or tool. In LangGraph, this means a conditional edge that checks iteration count before any other condition. In AutoGen, it's `max_consecutive_auto_reply` on the `UserProxyAgent`. The limit should be set to the maximum number of steps a successful run would ever need, not an arbitrary large number — if your agent legitimately needs more than 20 steps, that's a workflow design issue.

**What is the right level of human oversight in an agentic system?**

It depends on the blast radius of the actions the agent can take. Read-only agents (search, summarise, classify) can run fully automated. Agents that write to production systems, send external communications, or modify infrastructure should require human approval for novel action types — at least until you have a baseline of observed behavior to reason from. LangGraph's checkpointing supports this natively with `interrupt_before` on specific nodes.

**How does MCP differ from function calling / tool use?**

Tool use (OpenAI function calling, Anthropic tool_use) is the model-level primitive for telling an LLM which functions it can call and how to format the call. MCP is the transport and discovery layer that sits above tool use — it defines how tools are hosted, discovered, and invoked in a way that's framework-independent. An MCP server can expose its tools to any agent that speaks MCP, regardless of the underlying model or framework.
