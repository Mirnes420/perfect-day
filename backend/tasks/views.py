import os
from google import genai
import json
from rest_framework.decorators import api_view
from rest_framework.response import Response
import requests
from google.genai import types
from google.genai import errors
from django.utils import timezone
from dotenv import load_dotenv

load_dotenv()
# Initialize Gemini Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def get_location_info(lat, lng):
    # 1. Reverse Geocode to get City Name (using OpenStreetMap/Nominatim - Free)
    geo_url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json"
    headers = {'User-Agent': 'PerfectDayPlanner/1.0'}
    geo_res = requests.get(geo_url, headers=headers).json()
    city = geo_res.get('address', {}).get('city') or geo_res.get('address', {}).get('town', 'Unknown City')

    # 2. Get Weather (using Open-Meteo - Free)
    weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current_weather=true"
    weather_res = requests.get(weather_url).json()
    temp = weather_res['current_weather']['temperature']
    condition_code = weather_res['current_weather']['weathercode']
    # Simplified: you can map condition codes to "Sunny", "Rainy", etc.
    condition = "Clear" if condition_code < 3 else "Cloudy/Rainy"

    return city, temp, condition


@api_view(['POST'])
def generate_ai_plan(request):
    lat = request.data.get('lat')
    lng = request.data.get('lng')
    
    # 1. Reuse your weather/city logic from before
    city, temp, condition = get_location_info(lat, lng)

    now = timezone.now()
    current_time_str = now.strftime("%I:%M %p") # e.g., "02:30 PM"

    prompt = f"""
    You are an expert travel guide. Create a 'Perfect Day' itinerary for {city}.
    Current weather: {temp}°C and {condition}.
    CURRENT TIME: {current_time_str}.
    
    CRITICAL INSTRUCTION: All scheduled activities must start AFTER {current_time_str}. 
    Do not suggest activities for earlier in the day.
    
    Return the response ONLY as a JSON object with:
    1. "plan": list of 3-4 objects with "id", "time", and "activity".
    2. "suggestions": list of 3 objects with "id" and "activity".
    """

    # 3. Call Gemini
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type='application/json',
            # Thinking is supported on 2.5/3 models!
            thinking_config=types.ThinkingConfig(include_thoughts=True) 
        )
    )

    # 4. Parse and Send
    try:
        data = json.loads(response.text)
        data['city'] = city
        data['weather'] = f"{temp}°C, {condition}"
        return Response(data)
    except Exception as e:
        return Response({"error": "AI failed to format JSON"}, status=500)
