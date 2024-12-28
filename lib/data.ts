import React from "react";
import { CgOrganisation, CgWorkAlt } from "react-icons/cg";
import { FaGit, FaReact, FaAws, FaGitAlt, FaLinux, FaWindows, FaServer, FaNetworkWired, FaPython, FaNodeJs, FaDev, FaDatabase, FaJava, FaDocker, FaGithub, FaGitlab, FaUbuntu, FaApple, FaJenkins, FaPhp, FaLock } from "react-icons/fa";
import { LuGraduationCap } from "react-icons/lu";
import k8smultitenantImg from "@/public/k8sMultitenant.png";
import aspirehub from "@/public/aspirehub.png";
import ragchatbot from "@/public/chatbot.png"
import llmlocalrag from "@/public/llmlocalrag.png"
import infraApp from "@/public/infra-app.png"
import serverless from "@/public/serverless.png"
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
import archchat from "@/public/archchat.png"
import eca from "@/public//badges/eca.png"
import ecp from "@/public//badges/ecp.png"
import egp from "@/public//badges/egp.png"
import { BiLogoGoogleCloud, BiLogoKubernetes } from "react-icons/bi";
import { VscAzure, VscAzureDevops } from "react-icons/vsc";
import { TbApi, TbBrandNextjs, TbLoadBalancer } from "react-icons/tb";
import { FaBitbucket, FaGolang } from "react-icons/fa6";
import { SiAnsible, SiApache, SiAqua, SiArtifacthub, SiBuildkite, SiCilium, SiCircleci, SiCisco, SiConsul, SiCpanel, SiDatadog, SiDell, SiDynatrace, SiElasticstack, SiGitea, SiGithub, SiGithubactions, SiGnubash, SiGo, SiGrafana, SiHelm, SiHp, SiIbmcloud, SiIstio, SiKibana, SiLogstash, SiMongodb, SiMysql, SiNewrelic, SiNextdotjs, SiNginx, SiOpentelemetry, SiPagerduty, SiPaloaltosoftware, SiPostgresql, SiPowershell, SiPrisma, SiPrometheus, SiPulumi, SiSentry, SiSnyk, SiSonarqube, SiSpinnaker, SiSplunk, SiTerraform, SiTravisci, SiVagrant, SiVirtualbox, SiVmware, SiWordpress } from "react-icons/si";

export const links = [
  {
    name: "Home",
    hash: "#home",
  },
  {
    name: "About",
    hash: "#about",
  },
  {
    name: "Projects",
    hash: "#projects",
  },
  {
    name: "Skills",
    hash: "#skills",
  },
  {
    name: "Experience",
    hash: "#experience",
  },
  {
    name: "Certifications",
    hash: "#certifications",
  },
  {
    name: "Contact",
    hash: "#contact",
  },
] as const;

export const experiencesData = [
    {
    title: "Lead Cloud Solutions Architect",
    location: "360ace Tech, AB, CA",
    description: 
      "As a consultant and owner of 360ace Tech, I have helped multiple small and large-scale customers in their cloud adoption journey, \
      implementing foundation, migration, security, and integration solutions for customers based on their business requirements.",
    icon: React.createElement(CgOrganisation),
    date: "2021 - Present",
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
      "Implemented SRE solutions for customers across multiple cloud platforms for day-2 operations of Tetrate service bridge and Istio solutions.\
      Implemented Office 365 integrations and migration of internal services to cloud platforms on AWS and Azure. \
      Designed, implemented, and managed SDDC (virtualization, storage, networking) solutions. \
      Implemented application modernization solutions with dockerized workloads and Kubernetes across the enterprise.",
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
    title: "Pulumi Infra App",
    description:
      "A python based app that allows you to create and destroy storage buckets on AWS and GCP using Pulumi",
    tags: ["GCP", "AWS", "Pulumi", "Python"],
    imageUrl: infraApp,
    projecUrl: "https://github.com/adekoyadapo/python-infra-app",
  },
  {
    title: "Demo - AWS Serverless Deployment",
    description:
      "Simple terraform deployment for a REST API with AWS serverless infrastructure, API Gateway, s3 and Lambda",
    tags: ["AWS", "Serverless", "Lambda", "API-Gatewway", "Terraform"],
    imageUrl: serverless,
    projecUrl: "https://github.com/adekoyadapo/aws-serverless",
  },
  {
    title: "K8s Multitenant App",
    description:
      "A simple containerized based application packaged with helm and deployed with kubenetes as a multi-tenant application on kubernetes",
    tags: ["Python", "Terraform", "Kubernetes", "K3d", "Helm"],
    imageUrl: k8smultitenantImg,
    projecUrl: "https://github.com/adekoyadapo/k8s-multitenant-app",
  },
  {
    title: "RAG Local Chat Assistant",
    description:
      "Simple Chat interface to implement RAG using a local Vectordb, documents and GPT4AllEmbeddings",
    tags: ["Python", "AI Chatbot", "LLM", "RAG", "Hugginface", "Embeddings", "VectorDB"],
    imageUrl: llmlocalrag,
    projecUrl: "https://github.com/adekoyadapo/llm-rag-local",
  },
    {
    title: "Arch Chat Bot",
    description:
      "A Streamlit Chat interface that uses RAG to create architectural diagrams from python diagram module",
    tags: ["Python", "AI", "RAG", "OpenAI", "Streamlit"],
    imageUrl: archchat,
    projecUrl: "https://github.com/adekoyadapo/arch-gpt.git",
  },
    {
    title: "Rag Chat Bot",
    description:
      "React Chat interface to implement RAG using personal documents on AWS Bedrock and perform agent based actions",
    tags: ["React", "AI", "RAG", "AWS Bedrock", "lambda"],
    imageUrl: ragchatbot,
    projecUrl: "https://github.com/adekoyadapo/react-bedrock-rag-agent",
  },
    {
    title: "Aspirehub.org",
    description:
      "Web development, management and deployment for Aspirehub.org with the creation of google workspace and best practice for cloud and security adoption",
    tags: ["Webhosting", "Infrastructure Security", "Security+", "Workspace"],
    imageUrl: aspirehub,
    projecUrl: "https://aspirehub.org",
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
    icon: React.createElement(SiIbmcloud),
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
    name: 'Sonaqube',
    icon: React.createElement(SiSonarqube),
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
    icon: React.createElement(SiPowershell),
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
] as const;
