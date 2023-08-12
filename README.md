# Available Reads Fork
Displays listings on Goodreads of loan availability of ebooks and audiobooks through your local library's Overdrive account.

This fork adds import and export functionality, and has links point to Libby instead of Overdrive. Currently, this fork can only be built manually. It was originally based on a now-deleted fork by gradiian and is now based on rhollister's upstream.

I primarily test on Kiwi Browser on Android.

## Building

For chromium based browsers:

```bash
git clone https://github.com/holyspiritomb/goodreads goodreads
cd goodreads
cd build
./build_chrome.sh
```

For Firefox based browsers:

```bash
git clone https://github.com/holyspiritomb/goodreads goodreads
cd goodreads
cd build
./build_firefox.sh
```


![Screenshot](https://github.com/holyspiritomb/goodreads/raw/main/Screenshot_1.jpg)

![Screenshot](https://github.com/holyspiritomb/goodreads/raw/main/Screenshot_2.jpg)
