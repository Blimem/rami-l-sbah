#!/usr/bin/env python3
"""Builds the Rami Tounsi APK (no Android SDK needed) + an Android Studio project.

usage: python3 android/build_apk.py <jars_dir> <out_dir>
jars_dir: dalvik-dx-16.0.1.jar, apksig-2.3.0.jar, android-all.jar (robolectric android-all 7.0.0)
"""
import os, shutil, subprocess, sys, zipfile
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(HERE, "tools"))
import apkbin
from apkbin import Elem, T_INT, T_STRING, T_BOOL, T_REF, ANDROID_NS

PKG, LABEL, VC, VN = "com.limem.ramitounsi", "Rami Tounsi", 8, "2.6"
JARS, OUT = sys.argv[1], os.path.abspath(sys.argv[2])


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print(r.stdout, r.stderr)
        raise SystemExit("failed: " + " ".join(cmd))


def manifest():
    A = lambda n, t, v: (n, t, v, True)
    return Elem("manifest", [A("versionCode", T_INT, VC), A("versionName", T_STRING, VN), ("package", T_STRING, PKG, False)], [
        Elem("uses-sdk", [A("minSdkVersion", T_INT, 24), A("targetSdkVersion", T_INT, 34)]),
        Elem("uses-permission", [A("name", T_STRING, "android.permission.INTERNET")]),
        Elem("uses-permission", [A("name", T_STRING, "android.permission.VIBRATE")]),
        Elem("uses-permission", [A("name", T_STRING, "android.permission.RECORD_AUDIO")]),
        Elem("uses-permission", [A("name", T_STRING, "android.permission.MODIFY_AUDIO_SETTINGS")]),
        Elem("application", [A("label", T_STRING, LABEL), A("icon", T_REF, 0x7F010000), A("allowBackup", T_BOOL, True),
                             A("hardwareAccelerated", T_BOOL, True), A("supportsRtl", T_BOOL, True), A("usesCleartextTraffic", T_BOOL, True)], [
            Elem("activity", [A("name", T_STRING, PKG + ".MainActivity"), A("exported", T_BOOL, True), A("configChanges", T_INT, 0x04A0)], [
                Elem("intent-filter", [], [
                    Elem("action", [A("name", T_STRING, "android.intent.action.MAIN")]),
                    Elem("category", [A("name", T_STRING, "android.intent.category.LAUNCHER")])])])])])


MANIFEST_TEXT = f'''<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="{ANDROID_NS}">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <application android:label="{LABEL}" android:icon="@drawable/icon" android:allowBackup="true"
        android:hardwareAccelerated="true" android:supportsRtl="true" android:usesCleartextTraffic="true">
        <activity android:name=".MainActivity" android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
'''


def make_icon(path, s=512):
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    bg = Image.new("RGBA", (s, s))
    d = ImageDraw.Draw(bg)
    for y in range(s):
        t = y / s
        d.line([(0, y), (s, y)], fill=(int(15 + (6 - 15) * t), int(90 + (42 - 90) * t), int(99 + (49 - 99) * t), 255))
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, s - 1, s - 1], radius=s // 5, fill=255)
    img.paste(bg, (0, 0), mask)

    def card(w, h, fill, border):
        c = Image.new("RGBA", (w + 20, h + 20), (0, 0, 0, 0))
        cd = ImageDraw.Draw(c)
        cd.rounded_rectangle([10, 10, w + 9, h + 9], 26, fill=fill, outline=border, width=8)
        return c, cd
    back, bd = card(200, 280, (30, 110, 190, 255), (255, 255, 255, 255))
    for i in range(3):
        for j in range(4):
            cx, cy = 50 + i * 60, 55 + j * 62
            bd.polygon([(cx, cy - 18), (cx + 18, cy), (cx, cy + 18), (cx - 18, cy)], outline=(255, 255, 255, 120), width=3)
    img.alpha_composite(back.rotate(14, expand=True, resample=Image.BICUBIC), (60, 90))
    face, fd = card(200, 280, (255, 253, 248, 255), (226, 173, 76, 255))
    try:
        f = ImageFont.truetype(os.path.join(ROOT, "android", "tools", "font.ttf"), 120)
    except Exception:
        f = ImageFont.load_default(size=120)
    fd.text((110, 160), "71", fill=(216, 50, 44, 255), font=f, anchor="mm")
    fd.ellipse([95, 40, 125, 70], fill=(241, 199, 107, 255))
    img.alpha_composite(face.rotate(-10, expand=True, resample=Image.BICUBIC), (220, 80))
    img.resize((192, 192), Image.LANCZOS).save(path)


def main():
    work = os.path.join(OUT, "_work")
    shutil.rmtree(work, ignore_errors=True)
    os.makedirs(work)
    assets = os.path.join(work, "assets")
    shutil.copytree(os.path.join(ROOT, "public"), assets)
    icon = os.path.join(work, "icon.png")
    make_icon(icon)

    android_jar = os.path.join(JARS, "android-all.jar")
    jdir = os.path.join(work, "java", *PKG.split("."))
    os.makedirs(jdir)
    shutil.copy(os.path.join(HERE, "MainActivity.java"), jdir)
    cdir = os.path.join(work, "classes")
    os.makedirs(cdir)
    run(["javac", "-nowarn", "-source", "8", "-target", "8", "-cp", android_jar, "-d", cdir, os.path.join(jdir, "MainActivity.java")])
    dex = os.path.join(work, "classes.dex")
    run(["java", "-cp", os.path.join(JARS, "dalvik-dx-16.0.1.jar"), "com.android.dx.command.Main", "--dex", "--min-sdk-version=24", "--output=" + dex, cdir])

    unsigned = os.path.join(work, "unsigned.apk")
    with zipfile.ZipFile(unsigned, "w") as z:
        z.writestr(zipfile.ZipInfo("AndroidManifest.xml", (2024, 1, 1, 0, 0, 0)), apkbin.encode_manifest(manifest()), zipfile.ZIP_DEFLATED)

        def stored(name, data):
            zi = zipfile.ZipInfo(name, (2024, 1, 1, 0, 0, 0))
            zi.compress_type = zipfile.ZIP_STORED
            off = z.fp.tell() + 30 + len(name.encode())
            zi.extra = b"\0" * ((4 - off % 4) % 4)
            z.writestr(zi, data)
        stored("resources.arsc", apkbin.encode_arsc(PKG, "res/drawable/icon.png"))
        stored("res/drawable/icon.png", open(icon, "rb").read())
        z.write(dex, "classes.dex", zipfile.ZIP_DEFLATED)
        for base, _, files in os.walk(assets):
            for f in sorted(files):
                p = os.path.join(base, f)
                rel = "assets/" + os.path.relpath(p, assets).replace(os.sep, "/")
                if f.endswith(".woff2"):
                    stored(rel, open(p, "rb").read())
                else:
                    z.write(p, rel, zipfile.ZIP_DEFLATED)

    # sign (v2)
    sdir = os.path.join(work, "sign")
    os.makedirs(sdir)
    apksig = os.path.join(JARS, "apksig-2.3.0.jar")
    run(["javac", "-nowarn", "-cp", apksig, "-d", sdir, os.path.join(HERE, "tools", "Sign.java")])
    apk = os.path.join(OUT, "Rami-Tounsi.apk")
    run(["java", "--add-exports", "java.base/sun.security.x509=ALL-UNNAMED", "--add-exports", "java.base/sun.security.pkcs=ALL-UNNAMED", "--add-exports", "java.base/sun.security.util=ALL-UNNAMED", "-cp", os.pathsep.join([sdir, apksig]), "Sign", os.path.join(HERE, "tools", "rami-release.p12"), "ramitounsi", "rami", unsigned, apk])
    shutil.copy(icon, os.path.join(OUT, "icon.png"))

    # Android Studio / Gradle project with the same sources
    proj = os.path.join(OUT, "android-project")
    shutil.rmtree(proj, ignore_errors=True)
    main_dir = os.path.join(proj, "app", "src", "main")
    os.makedirs(os.path.join(main_dir, "res", "drawable"))
    shutil.copytree(assets, os.path.join(main_dir, "assets"))
    shutil.copytree(os.path.join(work, "java"), os.path.join(main_dir, "java"))
    shutil.copy(icon, os.path.join(main_dir, "res", "drawable", "icon.png"))
    open(os.path.join(main_dir, "AndroidManifest.xml"), "w").write(MANIFEST_TEXT)
    open(os.path.join(proj, "settings.gradle.kts"), "w").write('pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }\ndependencyResolutionManagement { repositories { google(); mavenCentral() } }\nrootProject.name = "RamiTounsi"\ninclude(":app")\n')
    open(os.path.join(proj, "build.gradle.kts"), "w").write('plugins { id("com.android.application") version "8.5.2" apply false }\n')
    open(os.path.join(proj, "app", "build.gradle.kts"), "w").write(f'''plugins {{ id("com.android.application") }}
android {{
    namespace = "{PKG}"
    compileSdk = 34
    defaultConfig {{ applicationId = "{PKG}"; minSdk = 24; targetSdk = 34; versionCode = {VC}; versionName = "{VN}" }}
    compileOptions {{ sourceCompatibility = JavaVersion.VERSION_1_8; targetCompatibility = JavaVersion.VERSION_1_8 }}
}}
''')
    open(os.path.join(proj, "gradle.properties"), "w").write("android.useAndroidX=false\norg.gradle.jvmargs=-Xmx2g\n")
    shutil.rmtree(work, ignore_errors=True)
    print("built", apk, os.path.getsize(apk), "bytes")


if __name__ == "__main__":
    main()
