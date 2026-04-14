using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class workflow_state
{
    public Guid id { get; set; }

    public Guid workflow_process_id { get; set; }

    public string code { get; set; } = null!;

    public string name { get; set; } = null!;

    public string? state_category_code { get; set; }

    public int sort_order { get; set; }

    public bool is_initial { get; set; }

    public bool is_terminal { get; set; }

    public string? color_code { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<chien_dich_cuu_tro> chien_dich_cuu_tros { get; set; } = new List<chien_dich_cuu_tro>();

    public virtual ICollection<lenh_dieu_chuyen_kho> lenh_dieu_chuyen_khos { get; set; } = new List<lenh_dieu_chuyen_kho>();

    public virtual ICollection<lich_su_trang_thai_nhiem_vu> lich_su_trang_thai_nhiem_vufrom_states { get; set; } = new List<lich_su_trang_thai_nhiem_vu>();

    public virtual ICollection<lich_su_trang_thai_nhiem_vu> lich_su_trang_thai_nhiem_vuto_states { get; set; } = new List<lich_su_trang_thai_nhiem_vu>();

    public virtual ICollection<lich_su_trang_thai_su_co> lich_su_trang_thai_su_cofrom_states { get; set; } = new List<lich_su_trang_thai_su_co>();

    public virtual ICollection<lich_su_trang_thai_su_co> lich_su_trang_thai_su_coto_states { get; set; } = new List<lich_su_trang_thai_su_co>();

    public virtual ICollection<nhiem_vu_cuu_ho> nhiem_vu_cuu_hos { get; set; } = new List<nhiem_vu_cuu_ho>();

    public virtual ICollection<phat_cuu_tro> phat_cuu_tros { get; set; } = new List<phat_cuu_tro>();

    public virtual ICollection<phieu_cap_phat_cuu_tro> phieu_cap_phat_cuu_tros { get; set; } = new List<phieu_cap_phat_cuu_tro>();

    public virtual ICollection<phieu_kho> phieu_khos { get; set; } = new List<phieu_kho>();

    public virtual ICollection<su_co> su_cos { get; set; } = new List<su_co>();

    public virtual workflow_process workflow_process { get; set; } = null!;

    public virtual ICollection<workflow_transition> workflow_transitionfrom_states { get; set; } = new List<workflow_transition>();

    public virtual ICollection<workflow_transition> workflow_transitionto_states { get; set; } = new List<workflow_transition>();

    public virtual ICollection<yeu_cau_cuu_tro> yeu_cau_cuu_tros { get; set; } = new List<yeu_cau_cuu_tro>();
}
