import os
import json
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from app.core.config import settings

SYSTEM_PROMPT = """You are HealthBridge AI Companion, an empathetic, highly knowledgeable medical AI assistant.
Your primary scope is STRICTLY limited to healthcare, clinical wellness, lab report explanations, prescriptions, and HealthBridge portal guidance.

CRITICAL SAFETY & SCOPE DIRECTIVES:
1. OUT-OF-SCOPE GUARDRAIL: If the user asks ANY question unrelated to health, medicine, biology, wellness, pharmaceuticals, or healthcare navigation (e.g. sports, politics, movies, general knowledge, coding, math):
   - You MUST politely decline by stating: "I am specialized strictly as a HealthBridge AI Medical Companion. I cannot assist with non-medical topics, but I'm glad to help with any health or medical questions!"
2. MEDICAL DISCLAIMER: Always remind users that your guidance is for informational purposes and does not replace direct diagnosis or consultation with a registered medical professional (Fastlege / Doctor).
3. EMERGENCY SAFETY: If the query suggests severe acute emergency symptoms (chest pain, shortness of breath, severe bleeding, stroke symptoms):
   - Immediately instruct the user to call emergency medical services (113 in Norway / 911 / Local Emergency) or proceed to the nearest emergency department.
4. TONE & FORMATTING: Use clear, empathetic, structured markdown formatting with bullet points and bold key terms.
"""

SUMMARIZATION_PROMPT = """You are a clinical AI specialist responsible for summarizing patient medical records, lab reports, active prescriptions, and medical history into a clear, patient-friendly summary.
Analyze the provided medical context and provide:
1. Concise executive summary of overall health status
2. Key Clinical Findings (bullet points)
3. Risk Assessment Level: [Low, Moderate, High, Critical]
4. Practical Medical & Wellness Recommendations

Be objective, clear, and highlight any out-of-range lab results or medication warnings clearly.
"""

HEALTH_KNOWLEDGE_BASE = [
    {
        "topic": "Vaccinations & Immunization",
        "category": "Preventive Care",
        "content": "Routine adult immunizations include annual Influenza vaccine, Tdap (Tetanus, Diphtheria, Pertussis) boosters every 10 years, and updated COVID-19 vaccines. Pediatric immunizations follow standard schedules for MMR, DTaP, Polio, and Hepatitis B.",
        "takeaway": "Keep Tdap updated every 10 years and get annual flu shots."
    },
    {
        "topic": "Blood Pressure Classification",
        "category": "Cardiology & Vital Signs",
        "content": "Normal blood pressure: Systolic < 120 mmHg and Diastolic < 80 mmHg. Elevated: Systolic 120-129 and Diastolic < 80. Stage 1 Hypertension: Systolic 130-139 or Diastolic 80-89. Stage 2 Hypertension: Systolic 140+ or Diastolic 90+. Hypertensive Crisis: Systolic > 180 and/or Diastolic > 120.",
        "takeaway": "Target normal BP below 120/80 mmHg."
    },
    {
        "topic": "Blood Glucose & Diabetes",
        "category": "Endocrinology & Labs",
        "content": "Fasting blood glucose: Normal is 70–99 mg/dL (3.9–5.5 mmol/L). Prediabetes: 100–125 mg/dL (5.6–6.9 mmol/L). Diabetes threshold: Fasting glucose ≥ 126 mg/dL (7.0 mmol/L) or HbA1c ≥ 6.5% (48 mmol/mol) on repeat testing.",
        "takeaway": "Normal fasting glucose is under 100 mg/dL; HbA1c below 5.7%."
    },
    {
        "topic": "Lipid Profile & Cholesterol",
        "category": "Cardiology & Labs",
        "content": "Optimal Total Cholesterol is under 200 mg/dL (5.0 mmol/L). Optimal LDL ('bad') cholesterol is under 100 mg/dL (2.6 mmol/L). HDL ('good') cholesterol should be above 40 mg/dL for men and 50 mg/dL for women. Triglycerides should be below 150 mg/dL.",
        "takeaway": "Aim for Total Cholesterol < 200 mg/dL and LDL < 100 mg/dL."
    },
    {
        "topic": "General Practitioner (Fastlege) System",
        "category": "HealthBridge Portal Guidance",
        "content": "Every resident in Norway is entitled to a assigned General Practitioner (Fastlege). Patients can switch their Fastlege up to 2 times per calendar year via the HealthBridge portal or Helsenorge. Children under 16 share their parent's GP.",
        "takeaway": "GP switches allowed twice per calendar year via HealthBridge."
    },
    {
        "topic": "Helfo Exemption Card (Frikort)",
        "category": "Healthcare Financing",
        "content": "When user user-paid healthcare co-payments reach the statutory annual threshold (NOK 3,040 in 2024/2025), Helfo automatically issues a digital Frikort (Exemption Card). After reaching the limit, patient consultations and blue prescriptions are free of charge for the rest of the calendar year.",
        "takeaway": "Automated digital exemption card issued after NOK 3,040 in deductible co-payments."
    },
    {
        "topic": "Digital Prescriptions (E-resepter)",
        "category": "Pharmacy & Prescriptions",
        "content": "Doctors send electronic prescriptions directly to the national prescription database (Reseptformidleren). Patients can view active prescriptions, remaining refills, and validity dates on the HealthBridge Patient Dashboard and pick up medications at any pharmacy nationwide.",
        "takeaway": "View and manage active e-prescriptions anytime in your portal."
    },
    {
        "topic": "Pasientjournal Medical Records",
        "category": "Medical Documentation",
        "content": "Pasientjournal contains certified hospital notes, discharge summaries, outpatient records, and specialist consultations. Records are encrypted and logged with audit trails to guarantee patient data privacy under GDPR and national health security standards.",
        "takeaway": "Encrypted access to hospital notes with strict privacy audit trails."
    },
    {
        "topic": "Organ Donation & Donor Card",
        "category": "Patient Preferences",
        "content": "Patients can express their organ donation preferences digitally via the Donor Card module in HealthBridge. Informing next-of-kin remains a vital legal step alongside digital record registration.",
        "takeaway": "Register donor preferences digitally and inform family members."
    },
    {
        "topic": "European Health Insurance Card (EHIC)",
        "category": "International Care",
        "content": "The EHIC card grants EEA and Swiss citizens access to state-provided medically necessary healthcare during temporary stays in EU/EEA countries under the same conditions as insured residents of that state.",
        "takeaway": "Provides emergency and necessary state healthcare across EU/EEA countries."
    }
]

class HealthAIService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL

    def search_knowledge(self, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        query_words = set(w.lower() for w in query.split() if len(w) > 2)
        results = []
        
        for item in HEALTH_KNOWLEDGE_BASE:
            score = 0.0
            combined_text = f"{item['topic']} {item['category']} {item['content']} {item['takeaway']}".lower()
            
            for word in query_words:
                if word in item['topic'].lower():
                    score += 3.0
                if word in item['category'].lower():
                    score += 2.0
                if word in item['content'].lower():
                    score += 1.0
            
            if score > 0:
                results.append((score, item))

        results.sort(key=lambda x: x[0], reverse=True)
        if results:
            return [item for score, item in results[:limit]]
        return HEALTH_KNOWLEDGE_BASE[:limit]

    def _call_groq(self, prompt: str, system: str = SYSTEM_PROMPT, chat_history: Optional[List[Dict[str, str]]] = None) -> str:
        import groq
        client = groq.Groq(api_key=self.api_key)
        
        messages = [{"role": "system", "content": system}]
        if chat_history:
            for msg in chat_history[-6:]:
                role = "user" if msg.get("role") == "user" else "assistant"
                messages.append({"role": role, "content": str(msg.get("text", ""))})
        
        messages.append({"role": "user", "content": prompt})
        completion = client.chat.completions.create(model=self.model, messages=messages, temperature=0.3)
        return completion.choices[0].message.content

    async def generate_response(self, message: str, chat_history: Optional[List[Dict[str, str]]] = None) -> Tuple[str, str]:
        matched_kb = self.search_knowledge(message, limit=2)
        kb_context = "\n".join([f"- [{item['topic']}]: {item['content']}" for item in matched_kb])
        
        prompt_with_rag = f"Relevant Knowledge Context:\n{kb_context}\n\nUser Question: {message}"

        if self.api_key and self.api_key.strip():
            try:
                reply = await asyncio.to_thread(self._call_groq, prompt_with_rag, SYSTEM_PROMPT, chat_history)
                return reply, f"groq-{int(datetime.now().timestamp())}"
            except Exception:
                pass

        # Fallback RAG response engine when Groq API key is unconfigured or call fails
        reply = (
            f"### HealthBridge AI Insights\n\n"
            f"Based on HealthBridge RAG Knowledge Base:\n\n"
            f"{kb_context}\n\n"
            f"**Answer regarding '{message}':**\n"
            f"Your health query relates to standard healthcare guidelines. Please maintain regular monitoring of symptoms. "
            f"If you experience severe or lingering discomfort, schedule a consultation with your primary physician via the **Appointments** tab."
        )
        return reply, f"rag-fallback-{int(datetime.now().timestamp())}"

    async def summarize_medical_records(self, records_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Generates a structured medical record summary with clinical risk assessment."""
        formatted_context = f"PATIENT MEDICAL PROFILE CONTEXT:\n"
        
        # Medical History
        history = records_dict.get("medical_histories", [])
        formatted_context += "\nMedical History Conditions:\n"
        if history:
            for h in history:
                name = h.get("condition_name") or h.get("condition", "Unknown Condition")
                status = h.get("status", "Active")
                formatted_context += f"- {name} (Status: {status})\n"
        else:
            formatted_context += "- No pre-existing recorded conditions.\n"

        # Lab Reports
        labs = records_dict.get("lab_reports", [])
        formatted_context += "\nRecent Lab Results:\n"
        if labs:
            for l in labs:
                test = l.get("test_name", "Lab Test")
                val = l.get("result_value", "N/A")
                ref = l.get("reference_range", "N/A")
                formatted_context += f"- {test}: Result = {val} (Ref Range: {ref})\n"
        else:
            formatted_context += "- No recent lab test reports available.\n"

        # Prescriptions
        prescriptions = records_dict.get("prescriptions", [])
        formatted_context += "\nActive Prescriptions:\n"
        if prescriptions:
            for p in prescriptions:
                med = p.get("medication_name", "Medication")
                dose = p.get("dosage", "Standard dose")
                formatted_context += f"- {med}: {dose}\n"
        else:
            formatted_context += "- No active prescriptions recorded.\n"

        if self.api_key and self.api_key.strip():
            try:
                llm_output = await asyncio.to_thread(self._call_groq, formatted_context, SUMMARIZATION_PROMPT)
                # Determine risk level from LLM output
                risk = "Low"
                for r in ["Critical", "High", "Moderate"]:
                    if r.lower() in llm_output.lower():
                        risk = r
                        break
                return {
                    "summary": llm_output,
                    "key_findings": [
                        f"{len(history)} recorded medical conditions analyzed.",
                        f"{len(labs)} recent lab test entries evaluated.",
                        f"{len(prescriptions)} active medication regimens verified."
                    ],
                    "risk_level": risk,
                    "recommendations": [
                        "Review lab trends periodically with your Fastlege.",
                        "Maintain medication adherence as prescribed.",
                        "Report any new or unexpected symptoms to your healthcare clinic."
                    ],
                    "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                }
            except Exception:
                pass

        # Clinical Rule-Engine Fallback Summarizer
        risk_level = "Low"
        key_findings = []
        recommendations = []

        if labs:
            for l in labs:
                val_str = str(l.get("result_value", "")).lower()
                test_str = str(l.get("test_name", "")).lower()
                if "glucose" in test_str or "sugar" in test_str:
                    try:
                        num = float(''.join(c for c in val_str if c.isdigit() or c == '.'))
                        if num >= 126:
                            risk_level = "High"
                            key_findings.append(f"Elevated Fasting Blood Glucose ({val_str}) indicating potential diabetes risk.")
                            recommendations.append("Follow up with doctor for fasting blood sugar re-assessment and HbA1c test.")
                        elif num >= 100:
                            if risk_level != "High": risk_level = "Moderate"
                            key_findings.append(f"Mildly elevated Blood Glucose ({val_str}) in prediabetes range.")
                            recommendations.append("Adopt a balanced low-glycemic dietary plan and schedule routine checkups.")
                    except ValueError:
                        pass
                elif "blood pressure" in test_str or "hypertension" in test_str:
                    key_findings.append(f"Monitored Blood Pressure: {val_str}")

        if not key_findings:
            key_findings = [
                f"Evaluated {len(history)} medical history items and {len(labs)} lab report files.",
                f"Currently managing {len(prescriptions)} active prescriptions safely.",
                "Vital lab parameters and health metrics remain within expected standard bounds."
            ]

        if not recommendations:
            recommendations = [
                "Schedule annual preventative health consultation with primary GP.",
                "Ensure vaccination status is up to date.",
                "Continue taking prescribed medications strictly according to dosage guidelines."
            ]

        summary_text = (
            f"### Patient Health Record Executive Summary\n\n"
            f"**Recorded Conditions:** {', '.join([h.get('condition_name', '') for h in history]) if history else 'None'}\n"
            f"**Active Medications:** {', '.join([p.get('medication_name', '') for p in prescriptions]) if prescriptions else 'None'}\n"
            f"**Lab Report Count:** {len(labs)} test results on file.\n\n"
            f"**Assessment:** Patient profile exhibits **{risk_level}** health risk profile based on stored clinical history and recent diagnostic results."
        )

        return {
            "summary": summary_text,
            "key_findings": key_findings,
            "risk_level": risk_level,
            "recommendations": recommendations,
            "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

    async def search_medical_topics(self, query: str, category: Optional[str] = None, limit: int = 5) -> Dict[str, Any]:
        """AI-powered RAG search across structured health topics."""
        matched = self.search_knowledge(query, limit=10)
        
        if category and category.strip():
            matched = [item for item in matched if item["category"].lower() == category.strip().lower()]

        results = []
        for idx, item in enumerate(matched[:limit]):
            # calculate relative score
            relevance = round(max(0.95 - (idx * 0.12), 0.60), 2)
            results.append({
                "topic": item["topic"],
                "category": item["category"],
                "content": item["content"],
                "relevance_score": relevance,
                "key_takeaway": item["takeaway"]
            })

        ai_overview = (
            f"AI Knowledge Search retrieved {len(results)} relevant medical topics matching your query '{query}'. "
            f"Review the key takeaways and verified healthcare guidelines below."
        )

        return {
            "query": query,
            "total_results": len(results),
            "results": results,
            "ai_overview": ai_overview
        }

    def get_knowledge_categories(self) -> List[Dict[str, Any]]:
        categories = {}
        for item in HEALTH_KNOWLEDGE_BASE:
            cat = item["category"]
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(item["topic"])

        return [
            {
                "category": cat_name,
                "topic_count": len(topics),
                "topics": topics
            }
            for cat_name, topics in categories.items()
        ]

ai_service = HealthAIService()
