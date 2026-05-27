#!/usr/bin/env python3
import re
import os
import sys

def minify_css(css_content):
    # Remove comments
    css = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
    # Remove extra whitespace around symbols
    css = re.sub(r'\s*([\{\};:,])\s*', r'\1', css)
    # Remove unnecessary spaces
    css = re.sub(r'\s+', ' ', css)
    # Trim leading/trailing spaces
    return css.strip()

def minify_js(js_content):
    # Remove single line comments (making sure not to break URLs like https://)
    # A simple way is to remove lines starting with // or space then //
    js = re.sub(r'(?<!:)\/\/.*$', '', js_content, flags=re.MULTILINE)
    # Remove multi-line comments
    js = re.sub(r'/\*.*?\*/', '', js, flags=re.DOTALL)
    # Remove unnecessary whitespace around operators and separators
    js = re.sub(r'\s*([=\{\}\(\)\[\]\+\-\*\/,;:!\?<>\|&])\s*', r'\1', js)
    # Remove extra spaces/newlines
    js = re.sub(r'\s+', ' ', js)
    return js.strip()

def minify_html(html_content):
    # Update style.css to style.min.css and script.js to script.min.js
    html = html_content.replace('href="style.css"', 'href="style.min.css"')
    html = html.replace('src="script.js"', 'src="script.min.js"')
    # Remove HTML comments
    html = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)
    # Collapse multiple whitespaces and newlines
    html = re.sub(r'\s+', ' ', html)
    # Remove whitespace between tags (only where safe, e.g., > <)
    html = re.sub(r'>\s+<', '><', html)
    return html.strip()

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, 'frontend')

    style_path = os.path.join(frontend_dir, 'style.css')
    script_path = os.path.join(frontend_dir, 'script.js')
    html_path = os.path.join(frontend_dir, 'index.html')

    print("[START] Starting Minification Process...")

    # Minify CSS
    if os.path.exists(style_path):
        print("Compiling style.css -> style.min.css")
        with open(style_path, 'r', encoding='utf-8') as f:
            content = f.read()
        minified = minify_css(content)
        out_path = os.path.join(frontend_dir, 'style.min.css')
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(minified)
        print(f"  Original: {len(content)} bytes | Minified: {len(minified)} bytes")

    # Minify JS
    if os.path.exists(script_path):
        print("Compiling script.js -> script.min.js")
        with open(script_path, 'r', encoding='utf-8') as f:
            content = f.read()
        minified = minify_js(content)
        out_path = os.path.join(frontend_dir, 'script.min.js')
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(minified)
        print(f"  Original: {len(content)} bytes | Minified: {len(minified)} bytes")

    # Minify HTML
    if os.path.exists(html_path):
        print("Compiling index.html -> index.min.html")
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()
        minified = minify_html(content)
        out_path = os.path.join(frontend_dir, 'index.min.html')
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(minified)
        print(f"  Original: {len(content)} bytes | Minified: {len(minified)} bytes")

    print("[SUCCESS] Minification complete!")

if __name__ == '__main__':
    main()
