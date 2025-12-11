import streamlit as st
import google.generativeai as genai

# 1. Cấu hình tiêu đề trang
st.set_page_config(page_title="My AI App", page_icon="🤖")
st.title("🤖 Chat với AI của tôi")

# 2. Nhập API Key (Người dùng nhập hoặc cài sẵn trong Secrets)
# Để bảo mật, chúng ta sẽ lấy từ Secrets của Streamlit Cloud sau này
api_key = st.secrets["AIzaSyBsNXE4ITxfItcc4Sw0PAG-bcOZRMAuwRs"]

if not api_key:
    st.error("Chưa cấu hình API Key.")
    st.stop()

# 3. Cấu hình Google Gemini
genai.configure(api_key=api_key)

# Cấu hình Model (Copy từ AI Studio nếu bạn có chỉnh sửa tham số)
generation_config = {
  "temperature": 0.7,
  "top_p": 0.95,
  "top_k": 64,
  "max_output_tokens": 8192,
}

model = genai.GenerativeModel(
  model_name="gemini-1.5-flash", # Hoặc model bạn chọn trong AI Studio
  generation_config=generation_config,
)

# 4. Tạo lịch sử chat (Session State)
if "messages" not in st.session_state:
    st.session_state.messages = []

# Hiển thị lịch sử chat cũ
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# 5. Xử lý input của người dùng
if prompt := st.chat_input("Nhập câu hỏi của bạn..."):
    # Hiển thị câu hỏi người dùng
    st.chat_message("user").markdown(prompt)
    st.session_state.messages.append({"role": "user", "content": prompt})

    # Gọi Google AI trả lời
    try:
        chat = model.start_chat(history=[
            {"role": m["role"], "parts": [m["content"]]} 
            for m in st.session_state.messages[:-1] # Lịch sử trừ câu mới nhất
        ])
        response = chat.send_message(prompt)
        
        # Hiển thị câu trả lời của AI
        with st.chat_message("model"):
            st.markdown(response.text)
        
        st.session_state.messages.append({"role": "model", "content": response.text})
            
    except Exception as e:
        st.error(f"Đã xảy ra lỗi: {e}")
