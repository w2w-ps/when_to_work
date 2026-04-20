package com.wavemaker.when_to_work.deleteAdditonalManager.service;


import com.wavemaker.when_to_work.deleteAdditonalManager.model.*;
import com.wavemaker.when_to_work.deleteAdditonalManager.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface DeleteAdditonalManagerService {

  /**
   * 
   * 
    * @param id  (required)
    * @param Authorization Authorization (optional)
   * @return RootResponse
   */
  @RequestLine("DELETE /managers/{id}")
  @Headers({
    "Content-Type: application/json",
    "Accept: */*",
    "Authorization: {Authorization}"  })
  RootResponse invoke(@Param("id") String id, @Param("Authorization") String Authorization);

}
