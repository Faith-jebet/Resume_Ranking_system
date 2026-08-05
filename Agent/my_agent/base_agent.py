import json
from my_agent.services.groq_client import client
from my_agent.config.settings import GROQ_MODEL


class GroqAgent:
    def __init__(self, name, description, instruction):
        self.name = name
        self.description = description
        self.instruction = instruction

    def run(self, payload):
        try:
            response = client.chat.completions.create(
                model=GROQ_MODEL,
                temperature=0,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": self.instruction},
                    {"role": "user",   "content": json.dumps(payload)},
                ],
            )
            return json.loads(response.choices[0].message.content)
        except (json.JSONDecodeError, AttributeError) as e:
            return {"error": f"Failed to parse LLM response: {str(e)}"}
        except Exception as e:
            return {"error": str(e)}
