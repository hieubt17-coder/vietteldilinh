# Viettel Wifi Landing Page

Trang web tĩnh demo cho dịch vụ lắp đặt wifi Viettel và quản lý đăng bài sản phẩm.

## Tính năng
- Giao diện giới thiệu gói cước Viettel
- Form đăng ký nhanh với thông tin: tên, gói cước, địa chỉ, số điện thoại, link đăng ký
- Quản lý bài đăng sản phẩm / khuyến mãi bằng localStorage
- Dễ triển khai lên GitHub Pages

## Cách triển khai GitHub Pages
1. Tạo repository trên GitHub.
2. Đẩy toàn bộ nội dung thư mục này vào nhánh `main`.
3. Vào Settings -> Pages -> chọn Branch `main` và thư mục `/root`.
4. Sau vài phút, trang sẽ mở tại địa chỉ `https://<tên-user>.github.io/<tên-repo>/`.

## Chạy local
```bash
cd viettel-wifi-site
python -m http.server 8000
```
Sau đó mở `http://localhost:8000`.
