from huggingface_hub import snapshot_download

MODEL_ID = "sshleifer/tiny-gpt2"
print(f"Model indiriliyor: {MODEL_ID}")
try:
    path = snapshot_download(repo_id=MODEL_ID,local_dir="./hf-test-model")
    print("\n✅ BAŞARILI")
    print(f"Model indirildi: {path}")
except Exception as e:
    print("\n❌ HATA")
    print(type(e).__name__)
    print(e)