def rank_candidates(candidates):
  
  eligible = [
    c for c in candidates 
    if c.get("error") != "DOMAIN_MISMATCH"
  ]
  
  disqualified = [
    c for c in candidates 
    if c.get("error") == "DOMAIN_MISMATCH"
  ]
  
  eligible.sort(
    key=lambda x: x["match_score"],
    reverse=True
  )
  
  return {
    "ranked_names":
      [c["candidate_name"] for c in eligible]
      +
      [c["candidate_name"] for c in disqualified],
      
      "disqualified":
        [{
          "name": c["candidate_name"],
          "reason": f"Domain mismatch: candidate's background is in {c.get('domain', 'unknown')}."
        }
         for c in disqualified
         
         ]
        
  }
    