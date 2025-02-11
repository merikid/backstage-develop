import requests

r = requests.get("https://httpbin.org/net")

print(r.json())