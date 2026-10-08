import urllib.request
import urllib.parse
import json

data = urllib.parse.urlencode({'image_url': 'https://images.unsplash.com/photo-1504148455328-c376907d081c'}).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1:8000/api/v1/analyze-item', data=data, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        print('HTTP Status:', response.status)
        result = json.loads(response.read().decode('utf-8'))
        print('Response JSON:\n', json.dumps(result, indent=2))
except Exception as e:
    print('Error:', e)
