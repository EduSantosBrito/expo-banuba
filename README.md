# expo-banuba

Banuba integration for expo

> This package doesn't work with Expo Go since it uses native code. <br/> You will need to use EAS build or expo-dev-client.

1 - Create your .env following ./example <br/>
2 - Install expo-banuba package <br/>
3 - Add this to your app.json:
```json
{
    "expo": {
        "plugins": [
            "expo-banuba",
            {
                "assetsPath": "./banuba-assets"
            }
        ]
    }
}
```
4 - Add banuba-assets folder (You can get it from ./examples/banuba-assets as well).