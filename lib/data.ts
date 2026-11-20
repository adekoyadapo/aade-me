import React from "react";
import { CgOrganisation, CgWorkAlt } from "react-icons/cg";
import { FaGit, FaReact, FaAws, FaGitAlt, FaLinux, FaWindows, FaServer, FaNetworkWired, FaPython, FaNodeJs, FaDev, FaDatabase, FaJava, FaDocker, FaGithub, FaGitlab, FaUbuntu, FaApple, FaJenkins, FaPhp, FaLock, FaCloud, FaTerminal } from "react-icons/fa";
import { LuGraduationCap } from "react-icons/lu";
import aws_csa from "@/public/badges/aws_csa.png"
import aws_csp from "@/public/badges/aws_csp.png"
import aws_dva from "@/public/badges/aws_dva.png"
import aws_dve from "@/public/badges/aws_dve.png"
import ccnpe from "@/public/badges/ccnpe.png"
import ccsec from "@/public/badges/ccsec.png"
import lpi from "@/public/badges/lpi.png"
import mcaa from "@/public/badges/mcaa.png"
import mcasa from "@/public/badges/mcasa.png"
import mcde from "@/public/badges/mcde.png"
import vcpdc from "@/public/badges/vcpdc.png"
import vcpnv from "@/public/badges/vcpnv.png"
import cka from "@/public/badges/cka.png"
import ckad from "@/public/badges/ckad.png"
import vcp from "@/public/badges/vcp.png"
import pcne from "@/public/badges/pcne.png"
import pcde from "@/public/badges/pcde.png"
import pcsp from "@/public/badges/pcsp.png"
import ibm from "@/public/badges/ibm.png"
import eca from "@/public//badges/eca.png"
import ecp from "@/public//badges/ecp.png"
import egp from "@/public//badges/egp.png"
import ecs from "@/public//badges/ecs.png"
import ece from "@/public//badges/ece.png"
import { BiLogoGoogleCloud, BiLogoKubernetes } from "react-icons/bi";
import { VscAzure, VscAzureDevops } from "react-icons/vsc";
import { TbApi, TbBrandNextjs, TbBrandOpenai, TbLoadBalancer } from "react-icons/tb";
import { FaBitbucket, FaGolang } from "react-icons/fa6";
import { SiAnsible, SiApache, SiAqua, SiArtifacthub, SiBuildkite, 
  SiCilium, SiCircleci, SiCisco, SiConsul, SiCpanel, SiDatadog, SiDell, SiDynatrace, SiElasticstack, SiClaude, SiElasticsearch, 
  SiGitea, SiGithub, SiGithubactions, SiGnubash, SiGo, SiGrafana, SiHelm, SiHp, SiIstio, SiKibana, SiLogstash, SiMongodb, SiMysql, SiNewrelic, SiNextdotjs, 
  SiNginx, SiOpentelemetry, SiPagerduty, SiPaloaltosoftware, SiPostgresql, SiPrisma, SiPrometheus, SiPulumi, SiSentry, SiSnyk, SiSonarqubeserver, SiSpinnaker, SiSplunk, 
  SiTerraform, SiTravisci, SiVagrant, SiVirtualbox, SiVmware, SiWordpress, SiLangchain, SiOllama, SiGooglegemini
} from "react-icons/si";


export const experiencesData = [
  {
    title: "Customer Architect",
    location: "Elastic, CA, US",
    description:
      "Serve as a Trusted Technical Advisor, driving adoption and expansion of Elastic solutions across Search, Observability, and Security. \
      Design and deliver AI-powered architectures leveraging Elasticsearch enterprise-grade features. \
      Architect enterprise-grade observability platforms using defined solutions for petabyte-scale log analytics. \
      Lead Security use-case deployments integrating SIEM, threat detection, and Attack Discovery for Fortune 500 customers. \
      Define Technical Success Plans aligned to customer business outcomes, translating complex Elastic capabilities into measurable ROI.",
    icon: React.createElement(CgOrganisation),
    date: "2024 - Present",
  },
  {
    title: "Lead Cloud Solutions Architect",
    location: "360ace Tech, AB, CA",
    description:
      "As a consultant and owner of 360ace Tech, I helped multiple small and large-scale customers in their cloud adoption journey, \
      implementing foundation, migration, security, and integration solutions based on their business requirements.",
    icon: React.createElement(CgOrganisation),
    date: "2021 - 2024",
  },
  {
    title: "Cloud Architect",
    location: "SADA, CA, US",
    description:
      "Designed and implemented large-scale foundational cloud architectural solutions for enterprise customers. \
      Performed large-scale workload migration, implementing infrastructure and application modernization requirements for customers. \
      Performed training and workshops for internal and external stakeholders with an emphasis on cloud adoption strategies.",
    icon: React.createElement(CgWorkAlt),
    date: "2021 - 2023",
  },
  {
    title: "Customer Engineer, Reliability Engineer",
    location: "Tetrate, Milpitas, US",
    description:
      "Implemented application modernization solutions with dockerized workloads and Kubernetes across large scale enterprise, \
      leveraging istio service mesh for network security and traffic management, with Otel, for trace visibility and logging, and Elasticsearch for search and analytics.\
      Implemented SRE solutions for customers across multiple cloud platforms for day-2 operations of Tetrate service bridge and Istio solutions.",
    icon: React.createElement(CgWorkAlt),
    date: "2021 - 2021",
  },
  {
    title: "DevOps Specialist",
    location: "Telus, Edmonton, CA",
    description:
      "Designed and implemented application modernization, CI/CD, and platform engineering for workloads across multiple frameworks. \
      Architected and implemented containerized workloads across various Kubernetes platforms - AKS, GKE, EKS, and OpenShift. \
      Designed, implemented, and managed SDDC (virtualization, storage, networking) solutions for CDN workloads required for content delivery.\
      Leveraged IaC for automated deployments across the enterprise.",
    icon: React.createElement(CgWorkAlt),
    date: "2019 - 2021",
  },
  {
    title: "Senior Network and Systems Administrator",
    location: "Calgary Parking Authority, Calgary, CA",
    description:
      "Redesigned the enterprise IT infrastructure and implemented key security solutions to meet PCI and SOC standards. \
      Implemented Office 365 integrations and migration of internal services to cloud platforms on AWS and Azure. \
      Designed, implemented and managed SDDC (virtualization, storage, networking) solutions. \
      Implemented application modernization solutions with dockerized workloads and Kubernetes accross the enterprise",
    icon: React.createElement(CgWorkAlt),
    date: "2018 - 2019",
  },
  {
    title: "Manager Infrastructure and Enterprise Solution ",
    location: "Web4Africa, Johannesburg, ZA",
    description:
      "Implemented data center collocation across multiple regions in Africa. \
      Designed and implemented IPv6 adoption across the enterprise with internet (BGP) and internet exchange integration across multiple data centers. \
      Designed and implemented large-scale infrastructure automation and proactive management across the web hosting platform improving customer retention and overall business revenue",
    icon: React.createElement(CgWorkAlt),
    date: "2016 - 2018",
  },
    {
    title: "Infrastructure and DevOps Specialist",
    location: "Konga Online, Capetown, ZA",
    description:
      "Implemented campus area infrastructure solution for the company warehouse. \
      Developed and implemented hybrid cloud solutions for VPN, authentication, database and ETL solutions across on-premise end-users and the cloud infrastructure. \
      Developed and implemented CICD solutions, monitoring and management of local and cloud-based infrastructure and application.",
    icon: React.createElement(CgWorkAlt),
    date: "2014 - 2016",
  },
  {
    title: "Enterprise Network Infrastructure Engineer",
    location: "Swift Networks, Lagos, NG",
    description:
      "Expanded Data Center Infrastructure, integrating new Servers, networking devices and WAN connectivity. \
      Managed over 200 cell sites and integrated LTE solutions across the metropolis and other regions in the country. \
      Coordinated and managed 5 - 10 engineers providing training, mentorship and guidance for improving their work efficiently",
    icon: React.createElement(CgWorkAlt),
    date: "2011 - 2014",
  },
    {
    title: "B.Eng, Electronics Engineering",
    location: "FUTA - Akure, NG",
    description:
      "Graduated as an Eletrical and Eletronics Engineer with a major in Embedded systems.",
    icon: React.createElement(LuGraduationCap),
    date: "2010",
  },
] as const;

export const projectsData = [
  {
    slug: "es-cluster-triage-agent",
    title: "Elasticsearch Cluster Triage Agent",
    description:
      "An AI day-2 operations agent deployed into Kibana Agent Builder. Alerts or schedules trigger an ES|QL workflow, and 19 diagnostic tools across 5 skill groups produce a root-cause report.",
    tags: ["Elasticsearch", "Agent Builder", "ES|QL", "Python", "TypeScript"],
    image: "/projects/es-cluster-triage-agent.webp",
    alt: "Diagram of the cluster triage agent: alert and schedule triggers feed a workflow, an AI agent with five skill groups, and a root-cause report card.",
    projecUrl: "https://github.com/adekoyadapo/es-cluster-triage-agent",
    links: [
      { label: "Repository", href: "https://github.com/adekoyadapo/es-cluster-triage-agent" },
    ],
  },
  {
    slug: "es-jin-airgaped",
    title: "Air-Gapped Semantic Search",
    description:
      "One command runs Elasticsearch, Kibana and Jina's embedding and reader containers locally. semantic_text handles chunking and embedding, with hybrid search through RRF and no outbound API calls.",
    tags: ["Elasticsearch", "Semantic Search", "Jina AI", "Docker", "RAG"],
    image: "/projects/es-jin-airgaped.webp",
    alt: "Diagram of air-gapped semantic search: a dashed boundary with a lock around a reader, embedding model and Elasticsearch, with a struck-out cloud outside.",
    projecUrl: "https://github.com/adekoyadapo/es-jin-airgaped",
    links: [
      { label: "Repository", href: "https://github.com/adekoyadapo/es-jin-airgaped" },
    ],
  },
  {
    slug: "es-app-pwdless",
    title: "Passwordless SSO for Elasticsearch",
    description:
      "A disposable k3d and ECK lab where Keycloak brokers OpenLDAP into Kibana over SAML and into Java, Python and Node apps over OIDC client credentials, validated by the Elasticsearch JWT realm.",
    tags: ["Elasticsearch", "Keycloak", "SAML", "OIDC", "Kubernetes", "ECK"],
    image: "/projects/es-app-pwdless.webp",
    alt: "Diagram of passwordless SSO: a directory feeds Keycloak, which signs users into Kibana over SAML and web apps over OIDC, both backed by Elasticsearch.",
    projecUrl: "https://github.com/adekoyadapo/es-app-pwdless",
    links: [
      { label: "Repository", href: "https://github.com/adekoyadapo/es-app-pwdless" },
    ],
  },
  {
    slug: "es-otel-monitoring",
    title: "Elasticsearch Monitoring with EDOT",
    description:
      "A local ECK lab that compares four ways to collect Elasticsearch monitoring data: EDOT autoops, Elastic Agent with the EDOT runtime, an API-key collector gateway, and upstream collector-contrib.",
    tags: ["Elasticsearch", "OpenTelemetry", "EDOT", "ECK", "Observability"],
    image: "/projects/es-otel-monitoring.webp",
    alt: "Diagram of four monitoring collection paths from a main Elasticsearch cluster, converging on a monitoring cluster and a Kibana dashboard.",
    projecUrl: "https://github.com/adekoyadapo/es-otel-monitoring",
    links: [
      { label: "Repository", href: "https://github.com/adekoyadapo/es-otel-monitoring" },
    ],
  },
  {
    slug: "tech-writer",
    title: "Technical Writer for Claude Code",
    description:
      "A Claude Code plugin that drafts technical content from your own samples first, researches with the Elastic docs MCP, routes work across Haiku, Sonnet and Opus, and generates SVG figures.",
    tags: ["Claude Code", "MCP", "AI Agents", "Python"],
    image: "/projects/tech-writer.webp",
    alt: "Diagram of the technical writer plugin: three model orbs feed a document with a pen badge, a figure window and an MCP plug to the docs.",
    projecUrl: "https://github.com/adekoyadapo/tech-writer",
    links: [
      { label: "Repository", href: "https://github.com/adekoyadapo/tech-writer" },
    ],
  },
  {
    slug: "es-uam",
    title: "User Activity Monitoring",
    description:
      "Kibana and Elasticsearch audit logging shipped with Filebeat to a monitoring cluster over a remote cluster link, with a Kibana view of who did what.",
    tags: ["Elasticsearch", "Audit logs", "Security"],
    image: "/projects/es-uam.webp",
    alt: "Diagram of user activity monitoring: users and a shielded main cluster send audit logs through Filebeat to a monitoring cluster and a Kibana activity list.",
    projecUrl: "https://github.com/adekoyadapo/es-uam",
    links: [
      { label: "Repository", href: "https://github.com/adekoyadapo/es-uam" },
    ],
  },
  {
    slug: "es-deployments",
    title: "Elastic Deployment Blueprints",
    description:
      "Terraform configurations that prototype Elastic on AKS, GKE, EKS, Minikube, k3d and Elastic Cloud, with Istio, tiers, snapshots, stack monitoring and cross-cluster search.",
    tags: ["Terraform", "ECK", "Kubernetes"],
    image: "/projects/es-deployments.webp",
    alt: "Diagram of Elastic deployment blueprints: a Terraform hub surrounded by six platform tiles for AKS, GKE, EKS, Minikube, k3d and Elastic Cloud.",
    projecUrl: "https://github.com/adekoyadapo/es-deployments",
    links: [
      { label: "Repository", href: "https://github.com/adekoyadapo/es-deployments" },
    ],
  },
  {
    slug: "k8s-multitenant-app",
    title: "Multitenant Kubernetes App",
    description:
      "One application deployed for many tenants with Terraform, k3d and Helm, with a namespace per tenant and ingress routing each tenant by domain.",
    tags: ["Terraform", "Kubernetes", "Helm"],
    image: "/projects/k8s-multitenant-app.webp",
    alt: "Diagram of a multitenant Kubernetes app: Terraform builds a k3d cluster with three tenant namespaces, a Helm chip and ingress routing by domain.",
    projecUrl: "https://github.com/adekoyadapo/k8s-multitenant-app",
    links: [
      { label: "Repository", href: "https://github.com/adekoyadapo/k8s-multitenant-app" },
    ],
  },
  {
    slug: "rag-assistants",
    title: "RAG Chat Assistants",
    description:
      "Two chat assistants that answer from your own documents: a local one with LangChain, GPT4All embeddings and a local vector database, and a React chat with an AWS Bedrock agent.",
    tags: ["RAG", "LangChain", "AWS Bedrock"],
    image: "/projects/rag-assistants.webp",
    alt: "Diagram of two RAG chat assistants: a local lane with embeddings and a vector database, and an AWS lane with Bedrock and Lambda actions, both ending in a chat window.",
    projecUrl: "https://github.com/adekoyadapo/llm-rag-local",
    links: [
      { label: "Local repository", href: "https://github.com/adekoyadapo/llm-rag-local" },
      { label: "AWS repository", href: "https://github.com/adekoyadapo/react-bedrock-rag-agent" },
    ],
  },
  {
    slug: "arch-gpt",
    title: "Architecture Diagram Generator",
    description:
      "A Streamlit app that turns a plain-language cloud architecture description into Python code for the Diagrams library, runs it and renders the diagram.",
    tags: ["Streamlit", "LLM", "Diagrams"],
    image: "/projects/arch-gpt.webp",
    alt: "Diagram of the architecture generator: a prompt window leads to a generated code window and a rendered architecture diagram, with an LLM badge.",
    projecUrl: "https://github.com/adekoyadapo/arch-gpt",
    links: [
      { label: "Repository", href: "https://github.com/adekoyadapo/arch-gpt" },
    ],
  },
] as const;


export const badgesData = [
  {
    name: 'Google',
    imageUrl: pcsp,
    link: 'https://www.credly.com/badges/e9cc1482-4ce4-4612-ae49-57a4274a187f/public_url'
  },
  {
    name: 'Google',
    imageUrl: pcde,
    link: 'https://www.credly.com/badges/4655d6b3-45de-4240-b250-2a5256c57ece/public_url'
  },
  {
    name: 'Google',
    imageUrl: pcne,
    link: 'https://www.credly.com/badges/2faa9cc1-8f7b-4e79-aaf5-ed1c336dc816/public_url'
  },
  {
    name: 'AWS',
    imageUrl: aws_csa,
    link: 'https://www.credly.com/badges/0b76c83a-764c-45d7-af6d-fd988a71d75b/public_url'
  },
  {
    name: 'AWS',
    imageUrl: aws_csp,
    link: 'https://www.credly.com/badges/6c7b373a-99b9-4f03-a5d9-7d0bf7bee7ea/public_url'
  },
  {
    name: 'AWS',
    imageUrl: aws_dva,
    link: 'https://www.credly.com/badges/4715ed76-850e-4888-a10b-7494b0192631/public_url'
  },
  {
    name: 'AWS',
    imageUrl: aws_dve,
    link: 'https://www.credly.com/badges/4b23e5a4-5c6f-48f1-bd4f-a2b200b69aeb/public_url'
  },
  {
    name: 'Cisco',
    imageUrl: ccnpe,
    link: 'https://www.credly.com/badges/76f85025-c770-44ce-b9bf-1da6a88721a4/public_url'
  },
    {
    name: 'Cisco',
    imageUrl: ccsec,
    link: 'https://www.credly.com/badges/359c27ab-1ffc-49a0-99e4-bc2ebfda2611/public_url'
  },
  {
    name: 'cka',
    imageUrl: cka,
    link: 'https://www.credly.com/badges/d3242df6-9f0c-4d8b-8635-de0f6109c3cf/public_url'
  },
  {
    name: 'ckad',
    imageUrl: ckad,
    link: 'https://www.credly.com/badges/8302e9f7-271a-4759-8360-a39d8b591e7f/public_url'
  },
    {
    name: 'Azure',
    imageUrl: mcaa,
    link: 'https://www.credly.com/badges/d9fab1cf-6ed8-4cb4-b17d-c228576a15a4/public_url'
  },
  {
    name: 'Azure',
    imageUrl: mcasa,
    link: 'https://www.credly.com/badges/cc01feb8-cc75-4a1b-b7e9-3de58ae4e5e3/public_url'
  },
  {
    name: 'Azure',
    imageUrl: mcde,
    link: 'https://www.credly.com/badges/b972e9c9-2692-46a5-8d5e-ea438e83db8e/public_url'
  },
  {
    name: 'Vmware',
    imageUrl: vcpdc,
    link: 'https://www.credly.com/badges/3ba15641-57ee-4450-8f36-165b15be3b33/public_url'
  },
  {
    name: 'Vmware',
    imageUrl: vcpnv,
    link: 'https://www.credly.com/badges/b0722524-88fb-4609-85d1-10885aed4316/public_url'
  },
  {
    name: 'Vmware',
    imageUrl: vcp,
    link: 'https://www.credly.com/badges/b44d184a-b5fe-42bc-ab76-5fbbfc9ca162/public_url'
  },
  {
    name: 'LPI',
    imageUrl: lpi,
    link: 'https://www.credly.com/badges/189800d9-c526-454c-842a-737cbf6241a6/public_url'
  },
  {
    name: 'IBM',
    imageUrl: ibm,
    link: 'https://www.credly.com/badges/a7c4be24-c6f8-4b92-98fe-adac902bb53d/public_url'
  },
  {
    name: 'ECA',
    imageUrl: eca,
    link: 'https://api.accredible.com/v1/frontend/credential_website_embed_image/certificate/112635855'
  },
  {
    name: 'ECP',
    imageUrl: ecp,
    link: 'https://api.accredible.com/v1/frontend/credential_website_embed_image/certificate/112843115'
  },
  {
    name: 'EGP',
    imageUrl: egp,
    link: 'https://api.accredible.com/v1/frontend/credential_website_embed_image/certificate/117018699'
  },
  {
    name: 'ECS',
    imageUrl: ecs,
    link: 'https://api.accredible.com/v1/frontend/credential_website_embed_image/certificate/173915287'
  },
  {
    name: 'ECE',
    imageUrl: ece,
    link: 'https://api.accredible.com/v1/frontend/credential_website_embed_image/certificate/157686572'
  },
] as const;

export const skillsData = [
  {
    name: 'AWS',
    icon: React.createElement(FaAws),
  },

  {
    name: 'GCP',
    icon: React.createElement(BiLogoGoogleCloud),
  },
  {
    name: 'Azure',
    icon: React.createElement(VscAzure),
  },
  {
    name: 'IBM',
    icon: React.createElement(FaCloud),
  },
    {
    name: 'Git',
    icon: React.createElement(FaGitAlt),
  },
      {
    name: 'Linux',
    icon: React.createElement(FaLinux),
  },
      {
    name: 'Windows',
    icon: React.createElement(FaWindows),
  },      
  {
    name: 'Ubuntu',
    icon: React.createElement(FaUbuntu),
  },      
  {
    name: 'Apple',
    icon: React.createElement(FaApple),
  },
    {
    name: 'Cisco',
    icon: React.createElement(SiCisco),
  },
  {
    name: 'PaloAlto',
    icon: React.createElement(SiPaloaltosoftware),
  },
  {
    name: 'HP',
    icon: React.createElement(SiHp),
  },
  {
    name: 'DELL',
    icon: React.createElement(SiDell),
  },
  {
    name: 'Vmware',
    icon: React.createElement(SiVmware),
  },
  {
    name: 'Wordpress',
    icon: React.createElement(SiWordpress),
  },
  {
    name: 'Cpanel',
    icon: React.createElement(SiCpanel),
  },
  {
    name: 'Server',
    icon: React.createElement(FaServer),
  },
  {
    name: 'Virtualization',
    icon: React.createElement(SiVirtualbox),
  },
  {
    name: 'Networking',
    icon: React.createElement(FaNetworkWired),
  },
  {
    name: 'Security',
    icon: React.createElement(FaLock),
  },
  {
    name: 'Database',
    icon: React.createElement(FaDatabase),
  },
    {
    name: 'Mysql',
    icon: React.createElement(SiMysql),
  },
    {
    name: 'Postgres',
    icon: React.createElement(SiPostgresql),
  },
    {
    name: 'Mongodb',
    icon: React.createElement(SiMongodb),
  },
      {
    name: 'Docker',
    icon: React.createElement(FaDocker),
  },
    {
    name: 'k8s',
    icon: React.createElement(BiLogoKubernetes),
  },
    {
    name: 'Helm',
    icon: React.createElement(SiHelm),
  },

  {
    name: 'Istio',
    icon: React.createElement(SiIstio),
  },
    {
    name: 'Cilium',
    icon: React.createElement(SiCilium),
  }, 
      {
    name: 'Github',
    icon: React.createElement(FaGithub),
  },
      {
    name: 'GithubAction',
    icon: React.createElement(SiGithubactions),
  },
    {
    name: 'Gitea',
    icon: React.createElement(SiGitea),
  },
  {
    name: 'AzureDevOps',
    icon: React.createElement(VscAzureDevops),
  },
  {
    name: 'CircleCI',
    icon: React.createElement(SiCircleci),
  },
  {
    name: 'TravisCI',
    icon: React.createElement(SiTravisci),
  },
  {
    name: 'Jenkins',
    icon: React.createElement(FaJenkins),
  },
  {
    name: 'SonarQube',
    icon: React.createElement(SiSonarqubeserver),
  },
  {
    name: 'Synk',
    icon: React.createElement(SiSnyk),
  },
  {
    name: 'Artifactory',
    icon: React.createElement(SiArtifacthub),
  },
  {
    name: 'Prisma',
    icon: React.createElement(SiPrisma),
  },
  {
    name: 'AquaSecurity',
    icon: React.createElement(SiAqua),
  },
  {
    name: 'Spinnaker',
    icon: React.createElement(SiSpinnaker),
  },
{
    name: 'Gitlab',
    icon: React.createElement(FaGitlab),
  },
{
    name: 'BitBucket',
    icon: React.createElement(FaBitbucket),
  },
{
    name: 'Buildkite',
    icon: React.createElement(SiBuildkite),
  },
  {
    name: 'Terraform',
    icon: React.createElement(SiTerraform),
  },
  {
    name: 'Vagrant',
    icon: React.createElement(SiVagrant),
  },
  {
    name: 'Ansible',
    icon: React.createElement(SiAnsible),
  },
  {
    name: 'Pulumi',
    icon: React.createElement(SiPulumi),
  },
  {
    name: 'Python',
    icon: React.createElement(FaPython),
  },
  {
    name: 'Bash',
    icon: React.createElement(SiGnubash),
  },
  {
    name: 'Powershell',
    icon: React.createElement(FaTerminal),
  },
  {
    name: 'go',
    icon: React.createElement(FaGolang),
  },
  {
    name: 'Nodejs',
    icon: React.createElement(FaNodeJs),
  },

  {
    name: 'React',
    icon: React.createElement(FaReact),
  },
  {
    name: 'PHP',
    icon: React.createElement(FaPhp),
  },
  {
    name: 'nextjs',
    icon: React.createElement(SiNextdotjs),
  },
{
    name: 'Java',
    icon: React.createElement(FaJava),
  },
{
    name: 'API',
    icon: React.createElement(TbApi),
  },
  {
    name: 'LoadBalancer',
    icon: React.createElement(TbLoadBalancer),
  },
  {
    name: 'Nginx',
    icon: React.createElement(SiNginx),
  },
  {
    name: 'Apache',
    icon: React.createElement(SiApache),
  },
  {
    name: 'Consul',
    icon: React.createElement(SiConsul),
  },
  {
    name: 'Dev',
    icon: React.createElement(FaDev),
  },
  {
    name: 'Splunk',
    icon: React.createElement(SiSplunk),
  },
  {
    name: 'Elastic',
    icon: React.createElement(SiElasticstack),
  },
  {
    name: 'Elasticsearch',
    icon: React.createElement(SiElasticsearch),
  },
  {
    name: 'Logstash',
    icon: React.createElement(SiLogstash),
  },
  {
    name: 'Kibanna',
    icon: React.createElement(SiKibana),
  },
  {
    name: 'Prometheus',
    icon: React.createElement(SiPrometheus),
  },
  {
    name: 'Grafana',
    icon: React.createElement(SiGrafana),
  },
  {
    name: 'DynaTrace',
    icon: React.createElement(SiDynatrace),
  },
  {
    name: 'NewRelic',
    icon: React.createElement(SiNewrelic),
  },
  {
    name: 'Datadog',
    icon: React.createElement(SiDatadog),
  },
  {
    name: 'Sentry',
    icon: React.createElement(SiSentry),
  },
  {
    name: 'pagerDuty',
    icon: React.createElement(SiPagerduty),
  },
  {
    name: 'Opentelemetry',
    icon: React.createElement(SiOpentelemetry),
  },
  {
    name: 'Langchain',
    icon: React.createElement(SiLangchain),
  },
  {
    name: 'Claude',
    icon: React.createElement(SiClaude),
  },
  {
    name: 'Gemini',
    icon: React.createElement(SiGooglegemini),
  },
  {
    name: 'Ollama',
    icon: React.createElement(SiOllama),
  },
  {
    name: 'OpenAI',
    icon: React.createElement(TbBrandOpenai),
  },
] as const;
