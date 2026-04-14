using System;
using System.Collections.Generic;

namespace RescueHub.Persistence.Entities.Scaffolded;

public partial class phat_cuu_tro
{
    public Guid id { get; set; }

    public string distribution_code { get; set; } = null!;

    public Guid? chien_dich_cuu_tro_id { get; set; }

    public Guid? diem_cuu_tro_id { get; set; }

    public Guid? ho_dan_id { get; set; }

    public Guid? cong_dan_id { get; set; }

    public Guid? su_co_id { get; set; }

    public Guid? workflow_state_id { get; set; }

    public Guid? distributed_by { get; set; }

    public DateTime? distributed_at { get; set; }

    public string? ack_method_code { get; set; }

    public string? ack_code { get; set; }

    public string? note { get; set; }

    public DateTime created_at { get; set; }

    public DateTime updated_at { get; set; }

    public virtual ICollection<chi_tiet_phat_cuu_tro> chi_tiet_phat_cuu_tros { get; set; } = new List<chi_tiet_phat_cuu_tro>();

    public virtual chien_dich_cuu_tro? chien_dich_cuu_tro { get; set; }

    public virtual cong_dan? cong_dan { get; set; }

    public virtual diem_cuu_tro? diem_cuu_tro { get; set; }

    public virtual nguoi_dung? distributed_byNavigation { get; set; }

    public virtual ho_dan? ho_dan { get; set; }

    public virtual su_co? su_co { get; set; }

    public virtual workflow_state? workflow_state { get; set; }

    public virtual ICollection<xac_nhan_nhan_cuu_tro> xac_nhan_nhan_cuu_tros { get; set; } = new List<xac_nhan_nhan_cuu_tro>();
}
