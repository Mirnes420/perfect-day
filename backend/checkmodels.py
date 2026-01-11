import google.generativeai as genai

genai.configure(api_key="AIzaSyC15RUFxLJ6LCB7fdu8J-iTriKu4iuZVqA")

for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)