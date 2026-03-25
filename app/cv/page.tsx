"use client";

import React from "react";
import { HiDownload } from "react-icons/hi";
import { BsLinkedin } from "react-icons/bs";
import { FaGithubSquare } from "react-icons/fa";
import { FaGlobe } from "react-icons/fa";
import Link from "next/link";

const experiences = [
  {
    title: "Customer Architect",
    company: "Elastic",
    location: "CA, US",
    period: "2024 – Present",
    bullets: [
      "Serve as Trusted Technical Advisor for enterprise accounts across Search, Observability, and Security use cases.",
      "Design AI-powered architectures using Elasticsearch vector search, ELSER semantic embeddings, and inference endpoints.",
      "Architect petabyte-scale log analytics platforms with OpenTelemetry, LogsDB, and OTLP ingestion pipelines.",
      "Lead SIEM and threat-detection deployments — 1,895+ detection rules, Attack Discovery, and SOAR integrations — for Fortune 500 environments.",
      "Build Technical Success Plans aligned to measurable business outcomes, translating Elastic capabilities into quantified ROI.",
    ],
  },
  {
    title: "Lead Cloud Solutions Architect",
    company: "360ace Tech",
    location: "AB, Canada",
    period: "2021 – 2024",
    bullets: [
      "Delivered end-to-end cloud adoption, migration, and platform engineering engagements for SMB and enterprise customers.",
      "Reduced infrastructure provisioning time by 50% via IaC-first delivery on Terraform and Pulumi across AWS, Azure, and GCP.",
      "Led multi-cloud Kubernetes modernisation — AKS, EKS, GKE, OpenShift — including GitOps pipelines with ArgoCD and FluxCD.",
      "Designed and implemented AI-based solutions for improved infrastructure delivery and end-user experience.",
      "Provided cloud security governance: PCI DSS, ISO 27001, SOC 2 compliance posture across multiple customer environments.",
    ],
  },
  {
    title: "Cloud Architect",
    company: "SADA Systems",
    location: "CA, US",
    period: "2021 – 2023",
    bullets: [
      "Led large-scale workload migration and application modernisation for enterprise GCP customers.",
      "Transformed monolithic applications to cloud-native Kubernetes microservices, improving DevOps efficiency by 40%.",
      "Delivered internal and external workshops on cloud adoption strategy, landing zone design, and DevSecOps practices.",
      "Coordinated hybrid network solutions — Direct Connect, VPN, WAN — across multi-cloud topologies.",
    ],
  },
  {
    title: "Customer Engineer – SRE / Service Mesh",
    company: "Tetrate.io",
    location: "Milpitas, CA, US",
    period: "2021",
    bullets: [
      "Trained enterprise DevOps and SRE teams on Istio and Tetrate Service Bridge at scale.",
      "Guided application telemetry adoption (OpenTelemetry traces, metrics) within service mesh for observability.",
      "Deployed and upgraded Kubernetes-based workloads with CI/CD tooling across GCP, AWS, and Azure.",
    ],
  },
  {
    title: "DevOps Specialist",
    company: "TELUS Communications",
    location: "Edmonton, AB, Canada",
    period: "2019 – 2021",
    bullets: [
      "Architected highly available containerised infrastructure for CDN workloads on AKS, Tanzu, and OpenShift.",
      "Implemented CI/CD automation reducing release windows for cloud deployments by 50%.",
      "Integrated APM and logging solutions (Splunk, New Relic) to improve application performance monitoring.",
    ],
  },
  {
    title: "Senior Network & Systems Administrator",
    company: "Calgary Parking Authority",
    location: "Calgary, AB, Canada",
    period: "2018 – 2019",
    bullets: [
      "Redesigned enterprise IT infrastructure to meet PCI DSS and SOC compliance requirements.",
      "Implemented SSO (Okta) and VPN solutions; integrated Office 365 and Azure cloud services.",
    ],
  },
  {
    title: "Manager, Infrastructure & Enterprise Solutions",
    company: "Web4Africa",
    location: "Johannesburg, ZA",
    period: "2016 – 2018",
    bullets: [
      "Managed data centre colocation and BGP routing across 4 African data centres including IPv6 adoption.",
      "Led automation initiatives reducing deployment times by 25%; improved customer retention and business ROI.",
    ],
  },
  {
    title: "Infrastructure & DevOps Specialist",
    company: "Konga Online Shopping",
    location: "Cape Town, ZA",
    period: "2014 – 2016",
    bullets: [
      "Implemented hybrid cloud solutions and CI/CD pipelines for warehouse and logistics infrastructure.",
      "Developed in-house open-source monitoring tools reducing infrastructure tooling costs by 30%.",
    ],
  },
  {
    title: "Enterprise Network Infrastructure Engineer",
    company: "Swift Networks Limited",
    location: "Lagos, NG",
    period: "2011 – 2014",
    bullets: [
      "Managed 200+ cell sites and LTE deployments; maintained 99.9% network uptime across the metropolis.",
    ],
  },
];

const certifications = [
  { group: "Elastic", items: ["Elastic Certified Engineer", "Elastic Certified Practitioner", "Elastic Certified Observability Engineer"] },
  { group: "Google Cloud", items: ["Professional Cloud Solutions Architect", "Professional Cloud DevOps Engineer", "Professional Cloud Network Engineer"] },
  { group: "AWS", items: ["Solutions Architect Professional", "DevOps Engineer Professional", "Solutions Architect Associate", "Developer Associate"] },
  { group: "Azure", items: ["Solutions Architect Expert", "Administrator Associate", "DevOps Engineer Expert"] },
  { group: "Kubernetes", items: ["CKA – Certified Kubernetes Administrator", "CKAD – Certified Kubernetes Application Developer"] },
  { group: "Other", items: ["VMware VCP-DCV, VCP-NV", "Cisco CCNP Enterprise, CCS-Enterprise", "LPI Linux Essentials", "IBM Cloud Kubernetes"] },
];

const coreSkills = [
  "Enterprise Architecture", "AI/ML Platforms", "Elasticsearch & Elastic Stack",
  "Vector Search & RAG", "Observability (OTel / LogsDB)", "SIEM & Threat Detection",
  "Kubernetes (AKS / EKS / GKE / OpenShift)", "Platform Engineering",
  "Cloud Platforms (AWS / GCP / Azure)", "Infrastructure-as-Code (Terraform / Pulumi)",
  "GitOps (ArgoCD / FluxCD)", "DevSecOps", "Distributed Systems",
  "Python / Bash / Go", "CI/CD (GitHub Actions / GitLab / ArgoCD)",
];

export default function CVPage() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .cv-container { max-width: 100% !important; padding: 0 !important; box-shadow: none !important; }
          .cv-card { box-shadow: none !important; border: none !important; }
          a { color: inherit !important; text-decoration: none !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print sticky top-0 z-50 bg-zinc-50/90 dark:bg-zinc-900/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-700 px-4 py-3 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition">
          ← Back to site
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium px-4 py-2 rounded-full hover:scale-105 transition"
          >
            <HiDownload className="text-base" />
            Save as PDF
          </button>
        </div>
      </div>

      {/* CV Content */}
      <div className="cv-container max-w-4xl mx-auto px-4 py-10 sm:py-14">
        <div className="cv-card bg-white dark:bg-zinc-800/50 rounded-2xl shadow-lg border border-zinc-100 dark:border-zinc-700 overflow-hidden">

          {/* Header */}
          <div className="bg-zinc-900 dark:bg-zinc-950 text-white px-8 sm:px-12 py-10">
            <h1 className="text-4xl font-bold tracking-tight mb-1">Ade Adekoya</h1>
            <p className="text-zinc-300 text-lg font-medium mb-4">Enterprise Solutions Architect</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-zinc-400">
              <span>Alberta, Canada</span>
              <a href="mailto:adekoyadapo@gmail.com" className="hover:text-white transition">adekoyadapo@gmail.com</a>
              <a href="https://aade.me" className="hover:text-white transition flex items-center gap-1">
                <FaGlobe className="text-xs" /> aade.me
              </a>
              <a href="https://linkedin.com/in/adekoya-adedapomola" target="_blank" rel="noopener noreferrer" className="hover:text-white transition flex items-center gap-1">
                <BsLinkedin className="text-xs" /> LinkedIn
              </a>
              <a href="https://github.com/adekoyadapo" target="_blank" rel="noopener noreferrer" className="hover:text-white transition flex items-center gap-1">
                <FaGithubSquare className="text-xs" /> GitHub
              </a>
            </div>
          </div>

          <div className="px-8 sm:px-12 py-8 space-y-8">

            {/* Summary */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">Summary</h2>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                Enterprise Solutions Architect with 15+ years across infrastructure, cloud, and platform engineering. Currently at Elastic as a Customer Architect, designing AI-powered search, petabyte-scale observability, and enterprise SIEM architectures for Fortune 500 clients. Proven track record across AWS, GCP, and Azure — from data centre foundations to cloud-native Kubernetes platforms to intelligent AI/ML inference pipelines.
              </p>
            </section>

            <hr className="border-zinc-100 dark:border-zinc-700" />

            {/* Core Skills */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">Core Competencies</h2>
              <div className="flex flex-wrap gap-2">
                {coreSkills.map((skill) => (
                  <span key={skill} className="text-sm bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-3 py-1 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            <hr className="border-zinc-100 dark:border-zinc-700" />

            {/* Experience */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-5">Experience</h2>
              <div className="space-y-7">
                {experiences.map((exp) => (
                  <div key={`${exp.company}-${exp.period}`} className="grid sm:grid-cols-[1fr_auto] gap-1 sm:gap-4">
                    <div>
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{exp.title}</h3>
                        <span className="text-zinc-500 dark:text-zinc-400 text-sm">— {exp.company}, {exp.location}</span>
                      </div>
                      <ul className="mt-1.5 space-y-1">
                        {exp.bullets.map((b, i) => (
                          <li key={i} className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed pl-3 border-l-2 border-zinc-200 dark:border-zinc-600">
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap sm:text-right mt-0.5 sm:mt-1">
                      {exp.period}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <hr className="border-zinc-100 dark:border-zinc-700" />

            {/* Certifications */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">Certifications</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {certifications.map((group) => (
                  <div key={group.group}>
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">{group.group}</p>
                    <ul className="space-y-0.5">
                      {group.items.map((cert) => (
                        <li key={cert} className="text-sm text-zinc-600 dark:text-zinc-300">{cert}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <hr className="border-zinc-100 dark:border-zinc-700" />

            {/* Education */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3">Education</h2>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">B.Eng, Electrical &amp; Electronics Engineering</p>
                  <p className="text-sm text-zinc-500">Federal University of Technology, Akure (FUTA) — Nigeria</p>
                </div>
                <span className="text-xs text-zinc-400">2010</span>
              </div>
            </section>

          </div>
        </div>

        {/* Footer note */}
        <p className="no-print text-center text-xs text-zinc-400 mt-6">
          Use <strong>Save as PDF</strong> above to export, or print via your browser (<kbd className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs">Ctrl/Cmd + P</kbd>).
        </p>
      </div>
    </>
  );
}
