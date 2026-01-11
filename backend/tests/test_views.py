import json
from unittest.mock import patch, MagicMock
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

class PerfectDayTests(APITestCase):

    @patch('tasks.views.requests.get')  # Patch requests inside your views file
    @patch('tasks.views.client.models.generate_content')  # Patch Gemini Client
    def test_generate_ai_plan_success(self, mock_gemini, mock_requests):
        """Test a successful plan generation with mocked APIs"""
        
        # 1. Mock the Geolocation Response (Nominatim)
        mock_geo = MagicMock()
        mock_geo.json.return_value = {
            'address': {'city': 'London'}
        }
        
        # 2. Mock the Weather Response (Open-Meteo)
        mock_weather = MagicMock()
        mock_weather.json.return_value = {
            'current_weather': {'temperature': 15.0, 'weathercode': 1}
        }
        
        # Assign mocks to requests.get side_effect to handle multiple calls
        mock_requests.side_effect = [mock_geo, mock_weather]

        # 3. Mock Gemini SDK Response
        # The SDK returns an object where .text is the JSON string
        mock_response = MagicMock()
        mock_ai_json = {
            "plan": [{"id": 1, "time": "10:00 AM", "activity": "Visit Big Ben"}],
            "suggestions": [{"id": 2, "activity": "Drink Tea"}]
        }
        mock_response.text = json.dumps(mock_ai_json)
        mock_gemini.return_value = mock_response

        # 4. Execute the POST request
        url = reverse('generate-perfect-day') # Ensure this matches your urls.py name
        data = {'lat': 51.5074, 'lng': -0.1278}
        response = self.client.post(url, data, format='json')

        # 5. Assertions
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['city'], 'London')
        self.assertEqual(response.data['weather'], '15.0°C, Clear')
        self.assertEqual(len(response.data['plan']), 1)
        self.assertEqual(response.data['plan'][0]['activity'], 'Visit Big Ben')

    @patch('tasks.views.get_location_info')
    @patch('tasks.views.client.models.generate_content')
    def test_generate_ai_plan_failure(self, mock_gemini, mock_loc):
        """Test how the view handles AI formatting errors"""
        mock_loc.return_value = ("London", 15.0, "Clear")
        
        # Force a JSON parsing error by returning invalid text
        mock_response = MagicMock()
        mock_response.text = "Not a JSON string"
        mock_gemini.return_value = mock_response

        url = reverse('generate-perfect-day')
        response = self.client.post(url, {'lat': 0, 'lng': 0}, format='json')

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data['error'], "AI failed to format JSON")