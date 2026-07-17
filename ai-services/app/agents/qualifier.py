"""Lead qualifier agent stub."""

from app.guardrails import guard_output


def qualify_lead(tenant_id: str, lead: dict) -> dict:
    score = 30
    reasons: list[str] = []

    if lead.get("company"):
        score += 20
        reasons.append("Empresa informada")
    if lead.get("budget"):
        score += 25
        reasons.append("Budget declarado")
    if lead.get("source") == "inbound":
        score += 15
        reasons.append("Origem inbound")

    tier = "hot" if score >= 70 else "warm" if score >= 50 else "cold"
    summary = guard_output(
        f"Lead tier={tier} score={score} for tenant {tenant_id}. " + "; ".join(reasons)
    )

    return {
        "tenant_id": tenant_id,
        "score": min(score, 100),
        "tier": tier,
        "reasons": reasons,
        "summary": summary,
    }
